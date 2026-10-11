import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersProcessor } from './orders.processor';
import { OrderCheckoutProcessor } from './order-checkout.processor';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'order-expiration',
      },
      {
        name: 'order-checkout-queue',
        limiter: {
          max: 100,
          duration: 1000,
        },
      },
    ),
    JwtModule.register({}),
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor, OrderCheckoutProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
