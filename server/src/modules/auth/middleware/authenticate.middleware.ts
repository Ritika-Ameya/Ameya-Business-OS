import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../../../interfaces/authenticatedRequest.interface';
import { UnauthorizedError } from '../../../utils/AppError';
import { verifyAccessToken } from '../services/token.service';

/**
 * JWT authentication middleware. Extracts Bearer token from Authorization header,
 * verifies it, and populates req.user.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};
