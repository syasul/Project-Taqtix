import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments & Tickets')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('orders/:id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mendapatkan link/token pembayaran Snap Midtrans untuk order (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token Snap berhasil dibuat.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pesanan tidak ditemukan.',
  })
  async payOrder(@Param('id') orderId: string) {
    return this.paymentsService.pay(orderId);
  }

  @Public()
  @Post('payments/webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Menerima notifikasi callback webhook dari payment gateway (Public/Webhook)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook diproses.' })
  async handleWebhook(@Param('provider') provider: string, @Body() body: any) {
    // Di masa depan bisa dispatch berdasarkan provider, saat ini default ke Midtrans
    return this.paymentsService.handleWebhook(body);
  }

  @Public()
  @Get('payments/:orderId/status')
  @ApiOperation({
    summary:
      'Mendapatkan status pembayaran pesanan secara polling (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status pembayaran berhasil diambil.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pesanan tidak ditemukan.',
  })
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }
}
