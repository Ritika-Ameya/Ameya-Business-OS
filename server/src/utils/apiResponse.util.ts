import type { Response } from 'express';

import { HTTP_STATUS } from '../constants';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = '',
  statusCode: number = HTTP_STATUS.OK,
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  errors: string[] = [],
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
