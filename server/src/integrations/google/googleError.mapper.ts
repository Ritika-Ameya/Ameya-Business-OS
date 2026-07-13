import { HTTP_STATUS, MESSAGES } from '../../constants';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/AppError';

const getErrorCode = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown Google API error';
};

export const mapGoogleError = (error: unknown, context: string): AppError => {
  const status = getErrorCode(error);
  const message = `${context}: ${getErrorMessage(error)}`;

  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return new AppError(message, HTTP_STATUS.BAD_REQUEST);
    case HTTP_STATUS.UNAUTHORIZED:
      return new UnauthorizedError(message);
    case HTTP_STATUS.FORBIDDEN:
      return new ForbiddenError(message);
    case HTTP_STATUS.NOT_FOUND:
      return new NotFoundError(message);
    case HTTP_STATUS.CONFLICT:
      return new ConflictError(message);
    case 429:
      return new AppError('Google API rate limit exceeded', 429);
    default:
      if (getErrorMessage(error).toLowerCase().includes('timeout')) {
        return new AppError('Google API request timed out', HTTP_STATUS.BAD_REQUEST);
      }
      return new InternalServerError(message || MESSAGES.INTERNAL_ERROR);
  }
};

export const wrapGoogleOperation = async <T>(
  context: string,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw mapGoogleError(error, context);
  }
};
