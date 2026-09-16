import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DokuService } from './doku/doku.service';

@Module({
  imports: [
    JwtModule.register({}),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, DokuService],
  exports: [PaymentsService, DokuService],
})
export class PaymentsModule {}
