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
  /**
   * Memvalidasi apakah kode promo / voucher aktif, valid untuk event terkait, dan belum melebihi kuota.
   */
  async validatePromoCode(dto: ValidatePromoCodeDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new BadRequestException('Event tidak ditemukan');
    }

    const voucher = await this.prisma.voucher.findFirst({
      where: {
        code: dto.code.toUpperCase(),
        organizerId: event.organizerId,
      },
    });

    if (voucher) {
      if (voucher.status !== 'active') {
        throw new BadRequestException('Voucher sudah tidak aktif atau kedaluwarsa');
      }
      const now = new Date();
      if (now < voucher.validFrom || now > voucher.validUntil) {
        throw new BadRequestException('Voucher berada di luar periode masa berlaku');
      }
      if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
        throw new BadRequestException('Kuota penggunaan voucher sudah habis');
      }
      if (voucher.eventId && voucher.eventId !== dto.eventId) {
        throw new BadRequestException('Voucher tidak berlaku untuk event ini');
      }
      if (
        voucher.applicableEventIds &&
        Array.isArray(voucher.applicableEventIds) &&
        voucher.applicableEventIds.length > 0 &&
        !voucher.applicableEventIds.includes(dto.eventId)
      ) {
        throw new BadRequestException('Voucher tidak berlaku untuk event ini');
      }

      return {
        valid: true,
        voucherId: voucher.id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        maxDiscountAmount: voucher.maxDiscountAmount,
      };
    }

    // Fallback ke legacy PromoCode
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: dto.code },
    });

    if (!promo || promo.eventId !== dto.eventId) {
      throw new BadRequestException('Kode promo/voucher tidak valid untuk event ini');
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

  /**
   * Memblokir tiket pengunjung (nonaktifkan pengunjung).
   */
  async blockTicket(ticketId: string, reason: string | undefined, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    await this.verifyEventOwnership(ticket.eventId, userId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isBlocked: true,
        blockedReason: reason || 'Diblokir oleh penyelenggara acara',
        blockedBy: userId,
        blockedAt: new Date(),
      },
    });
  }

  /**
   * Membuka blokir tiket pengunjung.
   */
  async unblockTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    await this.verifyEventOwnership(ticket.eventId, userId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isBlocked: false,
        blockedReason: null,
        blockedBy: null,
        blockedAt: null,
      },
    });
  }

  /**
   * Mendapatkan daftar pengunjung yang diblokir untuk suatu event.
   */
  async getBlockedVisitors(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.ticket.findMany({
      where: {
        eventId,
        isBlocked: true,
      },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
      },
      orderBy: { blockedAt: 'desc' },
    });
  }

  /**
   * Generate kode wristband/gelang secara batch untuk tiket event.
   */
  async generateWristbandCodes(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const ticketsWithoutCode = await this.prisma.ticket.findMany({
      where: {
        eventId,
        wristbandCode: null,
      },
      select: { id: true },
    });

    let count = 0;
    for (const t of ticketsWithoutCode) {
      // Kode gelang format 6-8 digit alphanumeric
      const code = `WB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await this.prisma.ticket.update({
        where: { id: t.id },
        data: {
          wristbandCode: code,
          wristbandPrintedAt: new Date(),
        },
      });
      count++;
    }

    return {
      success: true,
      message: `Berhasil men-generate ${count} kode gelang.`,
      generatedCount: count,
    };
  }

  /**
   * Export data wristband tiket dalam format CSV.
   */
  async exportWristbandCsv(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = ['name', 'wristbandCode', 'category', 'ticketId', 'status'];
    const rows = tickets.map((t) => [
      `"${(t.orderItem.attendeeName || '').replace(/"/g, '""')}"`,
      `"${t.wristbandCode || ''}"`,
      `"${(t.orderItem.ticketCategory.name || '').replace(/"/g, '""')}"`,
      `"${t.id}"`,
      `"${t.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      filename: `wristband-export-${eventId}.csv`,
      csv: csvContent,
    };
  }
}
