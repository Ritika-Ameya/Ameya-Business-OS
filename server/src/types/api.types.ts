export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckResponse {
  success: true;
  application: string;
  version: string;
  status: string;
}

export interface ValidationSchema {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}
