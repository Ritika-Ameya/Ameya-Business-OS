import type { Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../constants';
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedResult, ResponseMetadata } from '../types';

const buildMeta = (meta?: ResponseMetadata): ResponseMetadata | undefined => {
  if (!meta || Object.keys(meta).length === 0) {
    return undefined;
  }
  return meta;
};

const withMeta = (meta?: ResponseMetadata): { meta?: ResponseMetadata } => {
  const built = buildMeta(meta);
  return built ? { meta: built } : {};
};

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message: string = MESSAGES.SUCCESS,
    statusCode: number = HTTP_STATUS.OK,
    meta?: ResponseMetadata,
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...withMeta(meta),
    });
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = MESSAGES.CREATED,
    meta?: ResponseMetadata,
  ): Response<ApiSuccessResponse<T>> {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED, meta);
  }

  static updated<T>(
    res: Response,
    data: T,
    message: string = MESSAGES.UPDATED,
    meta?: ResponseMetadata,
  ): Response<ApiSuccessResponse<T>> {
    return ApiResponse.success(res, data, message, HTTP_STATUS.OK, meta);
  }

  static deleted(
    res: Response,
    message: string = MESSAGES.DELETED,
    meta?: ResponseMetadata,
  ): Response<ApiSuccessResponse<null>> {
    return ApiResponse.success(res, null, message, HTTP_STATUS.OK, meta);
  }

  static paginated<T>(
    res: Response,
    data: PaginatedResult<T>,
    message: string = MESSAGES.SUCCESS,
    meta?: ResponseMetadata,
  ): Response<ApiSuccessResponse<PaginatedResult<T>>> {
    return ApiResponse.success(res, data, message, HTTP_STATUS.OK, meta);
  }

  static error(
    res: Response,
    message: string,
    errors: string[] = [],
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    meta?: ResponseMetadata,
  ): Response<ApiErrorResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      ...withMeta(meta),
    });
  }
}
