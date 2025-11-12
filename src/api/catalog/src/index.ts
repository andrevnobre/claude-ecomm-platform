import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';
import { initializeCache } from './config/cache';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'catalog-api';

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Initialize cache connection
    await initializeCache();
    logger.info('Cache connection established');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info({
        port: PORT,
        service: SERVICE_NAME,
        environment: process.env.NODE_ENV,
        cellId: process.env.CELL_ID
      }, `${SERVICE_NAME} started successfully`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          const { closeDatabase } = await import('./config/database');
          await closeDatabase();
          logger.info('Database connection closed');

          // Close cache connection
          const { closeCache } = await import('./config/cache');
          await closeCache();
          logger.info('Cache connection closed');

          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
