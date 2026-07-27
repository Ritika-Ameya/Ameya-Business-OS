import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseBoolean, parseNumberField } from '../../../utils/sheetMapper.util';
import type { UserEntity, SessionEntity } from '../../../types';

const str = (r: Record<string, string>, k: string, fb = ''): string => r[k] ?? fb;

const parseStringArray = (raw: string): string[] => {
  if (!raw || raw === '[]') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

export const userMapper = createBaseEntityMapper<UserEntity>(
  (record, base) => ({
    ...base,
    email: str(record, 'email'),
    passwordHash: str(record, 'passwordHash'),
    name: str(record, 'name'),
    role: (str(record, 'role') || 'user') as UserEntity['role'],
    permissions: parseStringArray(str(record, 'permissions')),
    status: (str(record, 'status') || 'active') as UserEntity['status'],
    lastLoginAt: str(record, 'lastLoginAt') || undefined,
    failedLoginAttempts: parseNumberField(record.failedLoginAttempts, 0),
    lockedUntil: str(record, 'lockedUntil') || undefined,
  }),
  (entity) => ({
    email: String(entity.email ?? ''),
    passwordHash: String(entity.passwordHash ?? ''),
    name: String(entity.name ?? ''),
    role: String(entity.role ?? 'user'),
    permissions: JSON.stringify(entity.permissions ?? []),
    status: String(entity.status ?? 'active'),
    lastLoginAt: String(entity.lastLoginAt ?? ''),
    failedLoginAttempts: String(entity.failedLoginAttempts ?? 0),
    lockedUntil: String(entity.lockedUntil ?? ''),
  }),
);

export const sessionMapper = createBaseEntityMapper<SessionEntity>(
  (record, base) => ({
    ...base,
    userId: str(record, 'userId'),
    refreshTokenHash: str(record, 'refreshTokenHash'),
    expiresAt: str(record, 'expiresAt'),
    userAgent: str(record, 'userAgent'),
    ipAddress: str(record, 'ipAddress'),
    isRevoked: parseBoolean(record.isRevoked),
  }),
  (entity) => ({
    userId: String(entity.userId ?? ''),
    refreshTokenHash: String(entity.refreshTokenHash ?? ''),
    expiresAt: String(entity.expiresAt ?? ''),
    userAgent: String(entity.userAgent ?? ''),
    ipAddress: String(entity.ipAddress ?? ''),
    isRevoked: String(entity.isRevoked ?? false),
  }),
);
