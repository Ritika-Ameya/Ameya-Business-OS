import 'dotenv/config';

import createApp from './app';
import { env } from './config';
import { bootstrapService } from './integrations';
import { createLogger } from './utils/logger.util';

const logger = createLogger('Server');

const start = async (): Promise<void> => {
  logger.info(`${env.NODE_ENV} environment`);
  logger.info('Running Google Sheets bootstrap...');

  const bootstrapResult = await bootstrapService.run();

  if (bootstrapResult.status === 'completed') {
    logger.info(
      `Bootstrap OK — spreadsheet "${bootstrapResult.spreadsheetTitle}" ` +
        `(created ${bootstrapResult.createdWorksheets.length} worksheet(s))`,
    );
  } else {
    logger.error(
      `Bootstrap ${bootstrapResult.status}: ${bootstrapResult.error ?? 'unknown error'}`,
    );
    logger.warn('Server will start; infrastructure health will report bootstrap failure');
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Listening on port ${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
    logger.info(
      `Infrastructure health: http://localhost:${env.PORT}/api/health/infrastructure`,
    );
  });

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled rejection', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });
};

void start();
