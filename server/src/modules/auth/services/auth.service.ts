import { createHash } from 'node:crypto';
import { BaseService } from '../../../services/base.service';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../../../utils/AppError';
import { toISOString } from '../../../utils/date.util';
import type { UserEntity, SessionEntity } from '../../../types';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { hashPassword, verifyPassword } from './password.service';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './token.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_SESSIONS_PER_USER = 5;

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string; permissions: string[] };
}

class AuthService extends BaseService {
  constructor() {
    super('AuthService');
  }

  async login(
    email: string,
    password: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'inactive') {
      throw new ForbiddenError('Account is deactivated. Contact your administrator.');
    }

    if (user.status === 'locked' || (user.lockedUntil && new Date(user.lockedUntil) > new Date())) {
      throw new ForbiddenError('Account is locked. Please try again later.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('Password not set. Contact your administrator.');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<UserEntity & Record<string, unknown>> = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.status = 'locked';
        updates.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      }
      await userRepository.update(user.id, updates);
      await this.auditLog('user', user.id, 'login_failed', user.id, `Attempt ${attempts}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts on success
    await userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: '',
      status: (user.status as string) === 'locked' ? 'active' : user.status,
      lastLoginAt: toISOString(),
    } as Partial<UserEntity & Record<string, unknown>>);

    // Enforce max sessions
    const existingSessions = await sessionRepository.findByUserId(user.id);
    if (existingSessions.length >= MAX_SESSIONS_PER_USER) {
      // Revoke oldest
      const sorted = existingSessions.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      for (let i = 0; i <= sorted.length - MAX_SESSIONS_PER_USER; i++) {
        await sessionRepository.update(sorted[i].id, {
          isRevoked: true,
        } as Partial<SessionEntity & Record<string, unknown>>);
      }
    }

    // Create session
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: '', // set after token generation
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userAgent: userAgent.slice(0, 200),
      ipAddress,
      isRevoked: false,
    } as Omit<SessionEntity & Record<string, unknown>, 'id'>);

    const requestUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    };

    const accessToken = generateAccessToken(requestUser);
    const refreshToken = generateRefreshToken(user.id, session.id);

    // Store hashed refresh token
    await sessionRepository.update(session.id, {
      refreshTokenHash: hashToken(refreshToken),
    } as Partial<SessionEntity & Record<string, unknown>>);

    await this.auditLog('user', user.id, 'login', user.id, `IP: ${ipAddress}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions ?? [],
      },
    };
  }

  async refresh(
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const session = await sessionRepository.findById(payload.sessionId);
    if (!session || session.isRevoked || session.isDeleted) {
      throw new UnauthorizedError('Session revoked or not found');
    }

    if (new Date(session.expiresAt) < new Date()) {
      await sessionRepository.update(session.id, {
        isRevoked: true,
      } as Partial<SessionEntity & Record<string, unknown>>);
      throw new UnauthorizedError('Session expired');
    }

    // Verify token hash matches (rotation detection)
    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      // Possible token reuse — revoke all sessions for user
      await sessionRepository.revokeAllForUser(session.userId);
      await this.auditLog('session', session.userId, 'token_reuse_detected', session.userId);
      throw new UnauthorizedError('Token reuse detected. All sessions revoked.');
    }

    const user = await userRepository.findById(session.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account not active');
    }

    const requestUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    };

    const newAccessToken = generateAccessToken(requestUser);
    const newRefreshToken = generateRefreshToken(user.id, session.id);

    // Rotate refresh token
    await sessionRepository.update(session.id, {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userAgent: userAgent.slice(0, 200),
      ipAddress,
    } as Partial<SessionEntity & Record<string, unknown>>);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await sessionRepository.update(payload.sessionId, {
          isRevoked: true,
        } as Partial<SessionEntity & Record<string, unknown>>);
      } catch {
        // Token invalid/expired — no-op
      }
    }
    await this.auditLog('user', userId, 'logout', userId);
  }

  async logoutAll(userId: string): Promise<void> {
    await sessionRepository.revokeAllForUser(userId);
    await this.auditLog('user', userId, 'logout_all', userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.update(userId, {
      passwordHash: newHash,
    } as Partial<UserEntity & Record<string, unknown>>);

    // Revoke all sessions so user must re-login
    await sessionRepository.revokeAllForUser(userId);
    await this.auditLog('user', userId, 'password_changed', userId);
  }

  async seedSuperAdmin(): Promise<void> {
    const existing = await userRepository.findByEmail('admin@ameya.app');
    if (existing) {
      this.logInfo('Super Admin already exists — skipping seed');
      return;
    }

    const hash = await hashPassword('Admin@123');
    await userRepository.create({
      email: 'admin@ameya.app',
      passwordHash: hash,
      name: 'Super Admin',
      role: 'super_admin',
      permissions: [],
      status: 'active',
      lastLoginAt: '',
      failedLoginAttempts: 0,
      lockedUntil: '',
    } as Omit<UserEntity & Record<string, unknown>, 'id'>);

    this.logInfo('Super Admin seeded: admin@ameya.app / Admin@123');
  }

  private async auditLog(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    details?: string,
  ): Promise<void> {
    try {
      await activityLogRepository.create({
        entityType,
        entityId,
        action,
        actorId,
        details,
        occurredAt: toISOString(),
      } as Record<string, unknown>);
    } catch (err) {
      this.logError('Failed to write audit log', err);
    }
  }
}

export const authService = new AuthService();
