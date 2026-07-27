import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../interfaces/authenticatedRequest.interface';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { ValidationError, NotFoundError } from '../../../utils/AppError';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { hashPassword } from '../services/password.service';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';
import { ZodError } from 'zod';
import { toISOString } from '../../../utils/date.util';
import type { UserEntity } from '../../../types';

const parseBody = <T>(schema: { parse: (data: unknown) => T }, body: unknown): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(
        'Validation failed',
        err.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      );
    }
    throw err;
  }
};

const paramId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
};

const sanitizeUser = (user: UserEntity) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  permissions: user.permissions,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

class UserController {
  readonly list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await userRepository.findAll();
    ApiResponse.success(res, (users as UserEntity[]).map(sanitizeUser), 'Users retrieved');
  });

  readonly getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userRepository.findById(paramId(req));
    if (!user) throw new NotFoundError('User not found');
    ApiResponse.success(res, sanitizeUser(user as UserEntity), 'User retrieved');
  });

  readonly create = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const data = parseBody(createUserSchema, req.body);

    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ValidationError('User with this email already exists');

    const passwordHash = await hashPassword(data.password);

    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      permissions: data.permissions,
      status: data.status,
      lastLoginAt: '',
      failedLoginAttempts: 0,
      lockedUntil: '',
      createdBy: req.user?.id,
    } as Record<string, unknown>);

    await this.audit(req, 'user_created', user.id, `Created user ${data.email}`);

    ApiResponse.created(res, sanitizeUser(user as UserEntity), 'User created');
  });

  readonly update = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const data = parseBody(updateUserSchema, req.body);
    const userId = paramId(req);

    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    const updated = await userRepository.update(userId, {
      ...data,
      updatedBy: req.user?.id,
    } as Record<string, unknown>);

    await this.audit(req, 'user_updated', userId, JSON.stringify(data));

    ApiResponse.updated(res, sanitizeUser(updated as UserEntity), 'User updated');
  });

  readonly remove = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = paramId(req);

    if (userId === req.user?.id) {
      throw new ValidationError('Cannot delete your own account');
    }

    const deleted = await userRepository.delete(userId);
    if (!deleted) throw new NotFoundError('User not found');

    await sessionRepository.revokeAllForUser(userId);
    await this.audit(req, 'user_deleted', userId);

    ApiResponse.deleted(res, 'User deleted');
  });

  readonly activate = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = paramId(req);
    const updated = await userRepository.update(userId, {
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: '',
    } as Record<string, unknown>);
    if (!updated) throw new NotFoundError('User not found');
    await this.audit(req, 'user_activated', userId);
    ApiResponse.updated(res, sanitizeUser(updated as UserEntity), 'User activated');
  });

  readonly deactivate = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = paramId(req);
    if (userId === req.user?.id) throw new ValidationError('Cannot deactivate your own account');

    const updated = await userRepository.update(userId, {
      status: 'inactive',
    } as Record<string, unknown>);
    if (!updated) throw new NotFoundError('User not found');

    await sessionRepository.revokeAllForUser(userId);
    await this.audit(req, 'user_deactivated', userId);
    ApiResponse.updated(res, sanitizeUser(updated as UserEntity), 'User deactivated');
  });

  readonly resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = paramId(req);
    const { newPassword } = parseBody(resetPasswordSchema, req.body);

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const hash = await hashPassword(newPassword);
    await userRepository.update(userId, {
      passwordHash: hash,
      failedLoginAttempts: 0,
      lockedUntil: '',
    } as Record<string, unknown>);

    await sessionRepository.revokeAllForUser(userId);
    await this.audit(req, 'password_reset', userId, `By admin ${req.user?.email}`);
    ApiResponse.success(res, null, 'Password reset successfully');
  });

  readonly getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id ?? '';
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    ApiResponse.success(res, sanitizeUser(user as UserEntity), 'Profile retrieved');
  });

  readonly updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id ?? '';
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    const updated = await userRepository.update(userId, {
      name: name.trim(),
    } as Record<string, unknown>);

    if (!updated) throw new NotFoundError('User not found');
    ApiResponse.updated(res, sanitizeUser(updated as UserEntity), 'Profile updated');
  });

  private async audit(
    req: AuthenticatedRequest,
    action: string,
    entityId: string,
    details?: string,
  ): Promise<void> {
    try {
      await activityLogRepository.create({
        entityType: 'user',
        entityId,
        action,
        actorId: req.user?.id ?? 'system',
        details,
        occurredAt: toISOString(),
      } as Record<string, unknown>);
    } catch {
      // Audit failure should not block the operation
    }
  }
}

export const userController = new UserController();
