import type { Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../constants';
import type { ApiErrorResponse, ResponseMetadata } from '../types';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './AppError';
import { ApiResponse } from './apiResponse.util';

export const mapErrorToResponse = (
  err: Error,
  res: Response,
  meta?: ResponseMetadata,
): Response<ApiErrorResponse> => {
  if (err instanceof ValidationError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof NotFoundError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof ConflictError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof UnauthorizedError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof ForbiddenError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof InternalServerError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode, meta);
  }

  return ApiResponse.error(res, MESSAGES.INTERNAL_ERROR, [], HTTP_STATUS.INTERNAL_SERVER_ERROR, meta);
};

export const formatZodErrors = (issues: { path: PropertyKey[]; message: string }[]): string[] => {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
};
