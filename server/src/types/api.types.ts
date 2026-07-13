import type { ZodType } from 'zod';

export interface ResponseMetadata {
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: ResponseMetadata;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
  meta?: ResponseMetadata;
}

export type ApiResponseBody<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckResponse {
  success: true;
  application: string;
  version: string;
  status: string;
}

export interface ValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}
