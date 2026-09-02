import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Membuat pesanan baru dan mereservasi kuota tiket (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pesanan berhasil dibuat.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Kuota tidak mencukupi atau kode promo tidak valid.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Event mewajibkan login sebelum membeli tiket.',
  })
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    let authenticatedUserId: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('TAQTIX_JWT_ACCESS_SECRET'),
        });
        authenticatedUserId = payload?.sub;
      } catch {
        // Token invalid atau expired, tetap lanjut sebagai unauthenticated
      }
    }
    return this.ordersService.create(dto, authenticatedUserId);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan daftar semua pesanan milik pembeli yang sedang login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar pesanan pembeli berhasil diambil.',
  })
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.findMyOrders(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan status dan rincian pesanan berdasarkan ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detail pesanan berhasil diambil.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pesanan tidak ditemukan.',
  })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
