import type { NextFunction, Request, Response } from 'express';

import { env } from '../config';
import { AppError } from '../utils/AppError';
import { createLogger } from '../utils/logger.util';
import { mapErrorToResponse } from '../utils/errorMapper.util';

const errorLogger = createLogger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const meta = req.context
    ? { requestId: req.context.requestId, timestamp: req.context.timestamp }
    : undefined;

  const isOperational = err instanceof AppError && err.isOperational;

  if (env.NODE_ENV === 'development') {
    errorLogger.error(err.message, err);
  } else if (!isOperational) {
    errorLogger.error('Unhandled error', err);
  }

  mapErrorToResponse(err, res, meta);
};
