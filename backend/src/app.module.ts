import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GateModule } from './modules/gate/gate.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

/**
 * Modul utama / akar (root) aplikasi NestJS.
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
    AuthModule,
    EventsModule,
    TicketsModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    GateModule,
    DashboardModule,
    AffiliatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Menjadikan JwtAuthGuard aktif secara global di seluruh endpoint aplikasi
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Menjadikan RolesGuard aktif secara global untuk mengontrol otorisasi role
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
