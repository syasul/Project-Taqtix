import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
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
