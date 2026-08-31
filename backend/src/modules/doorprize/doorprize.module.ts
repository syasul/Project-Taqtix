import { Module } from '@nestjs/common';
import { DoorprizeController } from './doorprize.controller';
import { DoorprizeService } from './doorprize.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DoorprizeController],
  providers: [DoorprizeService],
  exports: [DoorprizeService],
})
export class DoorprizeModule {}
