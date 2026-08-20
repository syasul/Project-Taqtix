import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GateService } from './gate.service';
import { GateController } from './gate.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [GateController],
  providers: [GateService],
  exports: [GateService],
})
export class GateModule {}
