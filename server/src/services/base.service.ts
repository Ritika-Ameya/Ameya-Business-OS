import type { IService } from '../interfaces';
import { createLogger, type Logger } from '../utils/logger.util';

export abstract class BaseService implements IService {
  protected readonly logger: Logger;

  constructor(public readonly serviceName: string) {
    this.logger = createLogger(serviceName);
  }

  protected logInfo(message: string, data?: unknown): void {
    this.logger.info(message, data);
  }

  protected logWarn(message: string, data?: unknown): void {
    this.logger.warn(message, data);
  }

  protected logError(message: string, error?: unknown): void {
    this.logger.error(message, error);
  }

  protected logDebug(message: string, data?: unknown): void {
    this.logger.debug(message, data);
  }
}
