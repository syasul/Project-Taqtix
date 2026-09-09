import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';

/**
 * Entry point untuk TAQtix BullMQ Background Worker (PM2: taqtix-be-worker).
 * Berjalan pada proses V8 terpisah tanpa overhead Express HTTP Server.
 */
async function bootstrapWorker() {
  const logger = new Logger('TAQtixWorker');
  const app = await NestFactory.createApplicationContext(WorkerModule);

  logger.log('====================================================');
  logger.log('🚀 TAQtix BullMQ Worker Process Berjalan Sukses');
  logger.log('⚡ Antrean Aktif: orders, notifications, broadcast');
  logger.log('   (Berjalan pada proses mandiri tanpa HTTP overhead)');
  logger.log('====================================================');

  const shutdown = async (signal: string) => {
    logger.log(`Menerima sinyal ${signal}. Menghentikan worker secara aman (graceful shutdown)...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrapWorker();
