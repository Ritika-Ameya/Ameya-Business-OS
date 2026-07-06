import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants';
import { env } from '../config';
import { sendError } from '../utils/apiResponse.util';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.errors, err.statusCode);
    return;
  }

  if (env.NODE_ENV === 'development') {
    console.error('[Error]', err);
  }

  sendError(res, 'Internal server error', [], HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
