import { Module } from '@nestjs/common';
import { LineupController } from './lineup.controller';
import { LineupService } from './lineup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LineupController],
  providers: [LineupService],
  exports: [LineupService],
})
export class LineupModule {}
