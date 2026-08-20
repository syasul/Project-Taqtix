import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper untuk memastikan pengguna adalah pemilik event terkait.
   */
  private async verifyEventOwnership(eventId: string, userId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (!organizer) {
      throw new ForbiddenException('Akses ditolak: Anda bukan organizer');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizer.id) {
      throw new ForbiddenException(
        'Akses ditolak: Anda bukan pemilik event ini',
      );
    }
  }

  /**
   * Membuat kategori tiket baru untuk event tertentu.
   */
  async createCategory(
    eventId: string,
    dto: CreateTicketCategoryDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.ticketCategory.create({
      data: {
        eventId,
        name: dto.name,
        price: dto.price,
        quota: dto.quota,
        saleStartAt: new Date(dto.saleStart),
        saleEndAt: new Date(dto.saleEnd),
      },
    });
  }

  /**
   * Memperbarui detail kategori tiket.
   */
  async updateCategory(
    id: string,
    dto: UpdateTicketCategoryDto,
    userId: string,
  ) {
    const ticketCategory = await this.prisma.ticketCategory.findUnique({
      where: { id },
    });

    if (!ticketCategory) {
      throw new NotFoundException('Kategori tiket tidak ditemukan');
    }

    await this.verifyEventOwnership(ticketCategory.eventId, userId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.quota !== undefined) updateData.quota = dto.quota;
    if (dto.saleStart !== undefined)
      updateData.saleStartAt = new Date(dto.saleStart);
    if (dto.saleEnd !== undefined) updateData.saleEndAt = new Date(dto.saleEnd);

    return this.prisma.ticketCategory.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Mendapatkan daftar kategori tiket untuk event tertentu.
   */
  async getCategories(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    return this.prisma.ticketCategory.findMany({
      where: { eventId },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Membuat kode promo baru untuk event.
   */
  async createPromoCode(
    eventId: string,
    dto: CreatePromoCodeDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    // Cek duplikasi kode promo global
    const existingPromo = await this.prisma.promoCode.findUnique({
      where: { code: dto.code },
    });

    if (existingPromo) {
      throw new BadRequestException('Kode promo ini sudah digunakan di sistem');
    }

    return this.prisma.promoCode.create({
      data: {
        eventId,
        code: dto.code,
        discount: dto.discount,
        maxUsage: dto.maxUsage,
      },
    });
  }

  /**
   * Memvalidasi apakah kode promo aktif, valid untuk event terkait, dan belum melebihi kuota.
   */
  async validatePromoCode(dto: ValidatePromoCodeDto) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: dto.code },
    });

    if (!promo || promo.eventId !== dto.eventId) {
      throw new BadRequestException('Kode promo tidak valid untuk event ini');
    }

    if (promo.usedCount >= promo.maxUsage) {
      throw new BadRequestException('Kuota penggunaan kode promo sudah habis');
    }

    return {
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      discount: promo.discount,
    };
  }

  /**
   * Mendapatkan detail tiket untuk halaman e-ticket pembeli.
   */
  async getTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                buyer: true,
              },
            },
            ticketCategory: true,
          },
        },
        event: {
          include: {
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    return {
      ticketId: ticket.id,
      ticketStatus: ticket.status,
      ticketCategory: ticket.orderItem.ticketCategory.name,
      buyerName: ticket.orderItem.attendeeName,
      buyerEmail: ticket.orderItem.attendeeEmail,
      eventTitle: ticket.event.title,
      eventLocation: ticket.event.location,
      eventStartDate: ticket.event.startDate,
      eventEndDate: ticket.event.endDate,
      organizerName: ticket.event.organizer.name,
      signedQrPayload: ticket.qrPayload,
    };
  }

  /**
   * Mendapatkan daftar semua tiket dalam satu pesanan (Order).
   */
  async getTicketsByOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        orderItem: {
          orderId,
        },
      },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
        event: true,
      },
    });

    return tickets.map((ticket) => ({
      ticketId: ticket.id,
      ticketStatus: ticket.status,
      ticketCategory: ticket.orderItem.ticketCategory.name,
      buyerName: ticket.orderItem.attendeeName,
      buyerEmail: ticket.orderItem.attendeeEmail,
      eventTitle: ticket.event.title,
      signedQrPayload: ticket.qrPayload,
    }));
  }
}
