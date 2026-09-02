import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { BlockTicketDto } from './dto/block-ticket.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tickets & Promo')
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get('events/:id/ticket-categories')
  @ApiOperation({
    summary: 'Mendapatkan daftar kategori tiket suatu event (Public)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kategori tiket berhasil diambil.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event tidak ditemukan.',
  })
  async getCategories(@Param('id') eventId: string) {
    return this.ticketsService.getCategories(eventId);
  }

  @Post('organizer/events/:id/ticket-categories')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Membuat kategori tiket baru untuk event (Organizer Only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Kategori tiket berhasil dibuat.',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Akses ditolak.' })
  async createCategory(
    @Param('id') eventId: string,
    @Body() dto: CreateTicketCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.createCategory(eventId, dto, userId);
  }

  @Patch('organizer/ticket-categories/:id')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah kategori tiket (Organizer Only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kategori tiket berhasil diperbarui.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Kategori tiket tidak ditemukan.',
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateTicketCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.updateCategory(id, dto, userId);
  }

  @Post('events/:id/promo-codes')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Membuat kode promo baru untuk event (Organizer Only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Kode promo berhasil dibuat.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Kode promo sudah terdaftar.',
  })
  async createPromoCode(
    @Param('id') eventId: string,
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.createPromoCode(eventId, dto, userId);
  }

  @Public()
  @Post('orders/validate-promo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validasi kode promo (Public/Buyer)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status keabsahan kode promo.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Kode promo tidak valid atau kuota habis.',
  })
  async validatePromoCode(@Body() dto: ValidatePromoCodeDto) {
    return this.ticketsService.validatePromoCode(dto);
  }

  @Get('tickets/my')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan semua e-ticket milik pengguna yang sedang login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar e-ticket user berhasil didapatkan.',
  })
  async getMyTickets(@CurrentUser('id') userId: string) {
    return this.ticketsService.getMyTickets(userId);
  }

  @Public()
  @Get('tickets/:id')
  @ApiOperation({
    summary:
      'Mendapatkan detail e-ticket pembeli berdasarkan ID tiket (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detail e-ticket berhasil didapatkan.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tiket tidak ditemukan.',
  })
  async getTicket(@Param('id') ticketId: string) {
    return this.ticketsService.getTicket(ticketId);
  }

  @Public()
  @Get('tickets/by-order/:orderId')
  @ApiOperation({
    summary:
      'Mendapatkan daftar tiket elektronik berdasarkan ID pesanan (Public/Buyer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar e-ticket berhasil didapatkan.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pesanan tidak ditemukan.',
  })
  async getTicketsByOrder(@Param('orderId') orderId: string) {
    return this.ticketsService.getTicketsByOrder(orderId);
  }

  @Post('organizer/tickets/:id/block')
  @Roles('organizer', 'organizer_member')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Memblokir tiket pengunjung' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tiket berhasil diblokir.' })
  async blockTicket(
    @Param('id') ticketId: string,
    @Body() dto: BlockTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.blockTicket(ticketId, dto.reason, userId);
  }

  @Post('organizer/tickets/:id/unblock')
  @Roles('organizer', 'organizer_member')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Membuka blokir tiket pengunjung' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blokir tiket berhasil dibuka.' })
  async unblockTicket(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.unblockTicket(ticketId, userId);
  }

  @Get('organizer/events/:id/blocked-visitors')
  @Roles('organizer', 'organizer_member')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar pengunjung yang diblokir pada event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar tiket diblokir berhasil diambil.' })
  async getBlockedVisitors(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.getBlockedVisitors(eventId, userId);
  }

  @Post('organizer/events/:id/tickets/generate-wristband-codes')
  @Roles('organizer', 'organizer_member')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate kode wristband / gelang secara batch untuk tiket' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Kode wristband berhasil dibuat.' })
  async generateWristbandCodes(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.generateWristbandCodes(eventId, userId);
  }

  @Get('organizer/events/:id/tickets/wristband-export')
  @Roles('organizer', 'organizer_member')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export data wristband tiket dalam format CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Data export wristband berhasil dibuat.' })
  async exportWristbandCsv(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.exportWristbandCsv(eventId, userId);
  }
}
