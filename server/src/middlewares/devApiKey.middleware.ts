import type { NextFunction, Request, Response } from 'express';

import { env } from '../config';
import { HTTP_STATUS } from '../constants';

/**
 * Optional development-only API key gate.
 *
 * Behaviour:
 * - If DEV_API_KEY is unset/empty → middleware is a no-op (disabled).
 * - If set → requires matching X-DEV-KEY header for non-health routes.
 * - Never activates JWT/RBAC; future auth can sit alongside without conflict.
 */
export const developmentApiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const configuredKey = env.DEV_API_KEY?.trim();

  if (!configuredKey) {
    next();
    return;
  }

  const path = req.path;
  if (path === '/health' || path.startsWith('/health/')) {
    next();
    return;
  }

  const provided = req.header('x-dev-key');
  if (provided && provided === configuredKey) {
    next();
    return;
  }

  res.status(HTTP_STATUS.UNAUTHORIZED).json({
    success: false,
    message: 'Invalid or missing X-DEV-KEY header',
    errors: ['Set header X-DEV-KEY to the configured DEV_API_KEY value'],
  });
};
