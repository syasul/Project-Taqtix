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
import { TeamModule } from './modules/team/team.module';
import { WorkforceModule } from './modules/workforce/workforce.module';
import { CRMModule } from './modules/crm/crm.module';
import { AdminModule } from './modules/admin/admin.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { CashModule } from './modules/cash/cash.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { LineupModule } from './modules/lineup/lineup.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { PosModule } from './modules/pos/pos.module';
import { DoorprizeModule } from './modules/doorprize/doorprize.module';
import { ExportsModule } from './modules/exports/exports.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionGuard } from './common/guards/permission.guard';

/**
 * Modul utama / akar (root) aplikasi NestJS.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000, // 1 detik
          limit: 20, // max 20 request/detik (burst DDoS protection)
        },
        {
          name: 'medium',
          ttl: 10000, // 10 detik
          limit: 100, // max 100 request/10 detik
        },
        {
          name: 'long',
          ttl: 60000, // 1 menit
          limit: 300, // max 300 request/menit
        },
      ],
      errorMessage:
        'Terlalu banyak permintaan (Rate limit exceeded). Silakan tunggu beberapa saat.',
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
    TeamModule,
    WorkforceModule,
    CRMModule,
    AdminModule,
    VouchersModule,
    CashModule,
    TokensModule,
    CustomFieldsModule,
    FacilitiesModule,
    LineupModule,
    TransfersModule,
    PosModule,
    DoorprizeModule,
    ExportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Menjadikan ThrottlerGuard aktif secara global untuk proteksi rate limiting & anti-DDoS
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
    // Menjadikan PermissionGuard aktif secara global untuk mengontrol izin hak akses
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
