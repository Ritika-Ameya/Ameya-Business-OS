import 'dotenv/config';

import createApp from './app';
import { env } from './config';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[Server] ${env.NODE_ENV} environment`);
  console.log(`[Server] Listening on port ${env.PORT}`);
  console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
});

const shutdown = (signal: string): void => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Uncaught exception:', error);
  process.exit(1);
});
