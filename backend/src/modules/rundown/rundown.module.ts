import { Module } from '@nestjs/common';
import { RundownController } from './rundown.controller';
import { RundownService } from './rundown.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RundownController],
  providers: [RundownService],
  exports: [RundownService],
})
export class RundownModule {}
