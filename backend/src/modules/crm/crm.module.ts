import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CRMController } from './crm.controller';
import { CRMService } from './crm.service';
import { CRMProcessor } from './crm.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'broadcast',
      limiter: {
        max: 60, // Max 60 messages
        duration: 60000, // Per 1 minute (60,000 ms)
      },
    }),
  ],
  controllers: [CRMController],
  providers: [CRMService, CRMProcessor],
  exports: [CRMService],
})
export class CRMModule {}
