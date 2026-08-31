import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Token Generator (API Access)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/api-tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  @ApiOperation({ summary: 'Generate token API baru (Secret token hanya ditampilkan satu kali)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Token berhasil di-generate.' })
  async generateToken(
    @Body() dto: CreateApiTokenDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tokensService.generateToken(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar token API milik organizer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar API token berhasil diambil.' })
  async listTokens(@CurrentUser('id') userId: string) {
    return this.tokensService.listTokens(userId);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mencabut / me-revoke token API' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token berhasil dicabut.' })
  async revokeToken(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tokensService.revokeToken(id, userId);
  }
}
