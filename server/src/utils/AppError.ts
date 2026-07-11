import { HTTP_STATUS, MESSAGES } from '../constants';

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

export class ValidationError extends AppError {
  constructor(message: string = MESSAGES.VALIDATION_FAILED, errors: string[] = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = MESSAGES.NOT_FOUND, errors: string[] = []) {
    super(message, HTTP_STATUS.NOT_FOUND, errors);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = MESSAGES.CONFLICT, errors: string[] = []) {
    super(message, HTTP_STATUS.CONFLICT, errors);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = MESSAGES.UNAUTHORIZED, errors: string[] = []) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errors);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = MESSAGES.FORBIDDEN, errors: string[] = []) {
    super(message, HTTP_STATUS.FORBIDDEN, errors);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = MESSAGES.INTERNAL_ERROR, errors: string[] = []) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errors, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
