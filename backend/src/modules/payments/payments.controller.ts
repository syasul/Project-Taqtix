import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';

import type { Request } from 'express';

@ApiTags('Payments & Tickets')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('orders/:id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mendapatkan link/token pembayaran DOKU Checkout / Snap untuk order (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Link checkout berhasil dibuat.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pesanan tidak ditemukan.',
  })
  async payOrder(@Param('id') orderId: string) {
    return this.paymentsService.pay(orderId);
  }

  @Public()
  @SkipThrottle()
  @Post(['payments/webhook/:provider', 'v1/payments/webhook/:provider'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Menerima notifikasi callback webhook dari payment gateway (DOKU / Midtrans)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook diproses.' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const rawBody: Buffer | undefined = req.rawBody;
    const requestPath: string = req.originalUrl || req.url || '';
    return this.paymentsService.handleWebhook(
      body,
      provider,
      headers,
      rawBody,
      requestPath,
    );
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

  @Public()
  @Get('payments/status-check/:invoiceNumber')
  @ApiOperation({
    summary:
      'Fallback Check Status API ke payment gateway DOKU (Public/Scheduled)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status transaksi berhasil dicek ke gateway.',
  })
  async checkGatewayStatus(@Param('invoiceNumber') invoiceNumber: string) {
    return this.paymentsService.checkDokuOrderStatus(invoiceNumber);
  }
}
