import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreatePosTransactionDto } from './dto/create-pos-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Point of Sales (POS)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member', 'gate_staff')
@Controller('organizer/events/:id/pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('transaction')
  @ApiOperation({ summary: 'Membuat transaksi pembelian langsung di POS (on-site)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Transaksi POS berhasil diproses.' })
  async createTransaction(
    @Param('id') eventId: string,
    @Body() dto: CreatePosTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.posService.createTransaction(eventId, dto, userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Mendapatkan daftar transaksi POS pada event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar transaksi POS berhasil diambil.' })
  async listTransactions(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.posService.listTransactions(eventId, userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Mendapatkan ringkasan penjualan POS' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ringkasan POS berhasil diambil.' })
  async getSummary(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.posService.getSummary(eventId, userId);
  }
}
