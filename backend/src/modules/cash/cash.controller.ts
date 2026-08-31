import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Cash Management')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('cash/summary')
  @ApiOperation({ summary: 'Mendapatkan ringkasan kas org-level lintas seluruh event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Summary kas organisasi berhasil diambil.' })
  async getOrganizerCashSummary(@CurrentUser('id') userId: string) {
    return this.cashService.getOrganizerCashSummary(userId);
  }

  @Post('events/:id/cash')
  @ApiOperation({ summary: 'Mencatat transaksi cash manual untuk 1 event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Transaksi kas berhasil dicatat.' })
  async recordCash(
    @Param('id') eventId: string,
    @Body() dto: CreateCashTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cashService.recordCash(eventId, dto, userId);
  }

  @Get('events/:id/cash')
  @ApiOperation({ summary: 'Mendapatkan riwayat transaksi kas untuk 1 event beserta totalCashIn' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Riwayat kas event berhasil diambil.' })
  async getEventCash(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cashService.getEventCash(eventId, userId);
  }
}
