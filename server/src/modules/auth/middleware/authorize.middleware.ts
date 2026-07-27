import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../../../interfaces/authenticatedRequest.interface';
import { ForbiddenError, UnauthorizedError } from '../../../utils/AppError';

/** Role hierarchy: higher index = more privilege */
const ROLE_HIERARCHY: Record<string, number> = {
  user: 0,
  manager: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Requires one of the listed roles. Higher roles implicitly include lower roles.
 * e.g. requireRole('manager') allows manager, admin, super_admin.
 */
export const requireRole = (...allowedRoles: string[]) => {
  const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 99));

  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    if (userLevel >= minLevel) {
      next();
      return;
    }

    next(new ForbiddenError('Insufficient role privileges'));
  };
};

/**
 * Requires at least one of the listed permissions.
 * super_admin bypasses all permission checks.
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    const userPerms = new Set(req.user.permissions ?? []);
    const hasAny = requiredPermissions.some((p) => userPerms.has(p));

    if (hasAny) {
      next();
      return;
    }

    next(new ForbiddenError('Insufficient permissions'));
  };
};
