import { GOOGLE_DEFAULTS } from '../../constants';

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
};

const isRetryableError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  if (status !== undefined && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('rate limit')
    );
  }

  return false;
};

export const withGoogleRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const maxRetries = options.maxRetries ?? GOOGLE_DEFAULTS.MAX_RETRIES;
  const delayMs = options.delayMs ?? GOOGLE_DEFAULTS.RETRY_DELAY_MS;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      await sleep(delayMs * Math.pow(2, attempt));
    }
  }

  throw lastError;
};
