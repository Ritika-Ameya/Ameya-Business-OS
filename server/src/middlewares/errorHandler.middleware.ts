import type { NextFunction, Request, Response } from 'express';

import { env } from '../config';
import { AppError } from '../utils/AppError';
import { createLogger } from '../utils/logger.util';
import { mapErrorToResponse } from '../utils/errorMapper.util';
import { getResponseMeta } from '../utils/responseMeta.util';

const errorLogger = createLogger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isOperational = err instanceof AppError && err.isOperational;

  if (env.NODE_ENV === 'development') {
    errorLogger.error(err.message, err);
  } else if (!isOperational) {
    errorLogger.error('Unhandled error', err);
  }

  mapErrorToResponse(err, res, getResponseMeta(req));
};
