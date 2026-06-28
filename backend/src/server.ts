import 'dotenv/config';

import app from './app';
import { env } from './config/env';
import { db } from './config/db';
import { logger } from './utils/logger';

// ============================================================
// Server Entry Point
// ============================================================

async function bootstrap(): Promise<void> {
  try {
    // ── Run Database Migrations ─────────────────────────
    logger.info('Server', 'Running database migrations…');
    await db.migrate.latest();
    logger.info('Server', 'Migrations completed successfully');

    // ── Start HTTP Server ───────────────────────────────
    app.listen(env.PORT, () => {
      logger.info('Server', `🚀 SmartERP API running on port ${env.PORT}`);
      logger.info('Server', `   Environment: ${env.NODE_ENV}`);
      logger.info('Server', `   CORS origin: ${env.CORS_ORIGIN}`);
    });
  } catch (err) {
    logger.error('Server', 'Failed to start server', err);
    process.exit(1);
  }
}

// ── Graceful Shutdown & Error Handling ─────────────────────

process.on('uncaughtException', (err: Error) => {
  logger.error('Server', 'Uncaught Exception', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Server', 'Unhandled Rejection', reason);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('Server', 'SIGTERM received — shutting down gracefully');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Server', 'SIGINT received — shutting down gracefully');
  await db.destroy();
  process.exit(0);
});

bootstrap();
