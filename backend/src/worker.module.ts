import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './modules/prisma/prisma.module';
import { OrdersModule } from './modules/orders/orders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CRMModule } from './modules/crm/crm.module';

/**
 * WorkerModule — Modul terisolasi untuk background job BullMQ.
 * Dijalankan dalam proses mandiri (taqtix-be-worker) terpisah dari HTTP API server.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl =
          config.get<string>('REDIS_URL') ||
          process.env.REDIS_URL ||
          'redis://localhost:6379';
        const explicitPassword =
          config.get<string>('REDIS_PASSWORD') ||
          process.env.REDIS_PASSWORD ||
          undefined;

        try {
          const parsed = new URL(redisUrl);
          const password = parsed.password || explicitPassword || undefined;
          return {
            redis: {
              host: parsed.hostname || 'localhost',
              port: parseInt(parsed.port || '6379', 10),
              username: parsed.username || undefined,
              password,
            },
          };
        } catch {
          return {
            redis: {
              host: 'localhost',
              port: 6379,
              password: explicitPassword,
            },
          };
        }
      },
    }),
    PrismaModule,
    OrdersModule,
    NotificationsModule,
    CRMModule,
  ],
})
export class WorkerModule {}
