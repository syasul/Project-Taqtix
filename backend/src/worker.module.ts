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
          config.get<string>('REDIS_URL') || 'redis://localhost:6379';
        try {
          const parsed = new URL(redisUrl);
          return {
            redis: {
              host: parsed.hostname,
              port: parseInt(parsed.port || '6379', 10),
              username: parsed.username || undefined,
              password: parsed.password || undefined,
            },
          };
        } catch {
          return {
            redis: {
              host: 'localhost',
              port: 6379,
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
