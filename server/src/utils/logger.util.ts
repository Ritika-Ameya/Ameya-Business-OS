import { env } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getMinLevel = (): LogLevel => {
  if (env.NODE_ENV === 'production') {
    return 'info';
  }
  if (env.NODE_ENV === 'test') {
    return 'warn';
  }
  return 'debug';
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
};

const formatMessage = (level: LogLevel, context: string, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
};

export class Logger {
  constructor(private readonly context: string) {}

  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      if (data !== undefined) {
        console.debug(formatMessage('debug', this.context, message), data);
      } else {
        console.debug(formatMessage('debug', this.context, message));
      }
    }
  }

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      if (data !== undefined) {
        console.info(formatMessage('info', this.context, message), data);
      } else {
        console.info(formatMessage('info', this.context, message));
      }
    }
  }

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      if (data !== undefined) {
        console.warn(formatMessage('warn', this.context, message), data);
      } else {
        console.warn(formatMessage('warn', this.context, message));
      }
    }
  }

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      if (error !== undefined) {
        console.error(formatMessage('error', this.context, message), error);
      } else {
        console.error(formatMessage('error', this.context, message));
      }
    }
  }
}

export const createLogger = (context: string): Logger => new Logger(context);
