import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { ApiV1Controller } from './api-v1.controller';
import { TokensService } from './tokens.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TokensController, ApiV1Controller],
  providers: [TokensService, ApiKeyAuthGuard],
  exports: [TokensService, ApiKeyAuthGuard],
})
export class TokensModule {}
