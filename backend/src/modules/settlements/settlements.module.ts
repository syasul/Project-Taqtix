import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
