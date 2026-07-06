import { HTTP_STATUS } from '../constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: string[] = [],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
