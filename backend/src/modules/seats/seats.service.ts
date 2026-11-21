import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateSeatsDto } from './dto/generate-seats.dto';
import { SeatStatus } from '@prisma/client';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper untuk validasi bahwa user adalah pemilik organizer dari event tertentu.
   */
  private async getOrganizerEventOrThrow(eventId: string, userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        organizer: true,
      },
    });

    const organizer =
      member?.organizer ||
      (await this.prisma.organizer.findUnique({
        where: { userId },
      }));

    if (!organizer) {
      throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizer.id) {
      throw new ForbiddenException('Akses ditolak: Anda bukan pengelola event ini');
    }

    return event;
  }

  /**
   * Bersihkan kursi yang kunciannya (concurrency lock 10 menit) telah kedaluwarsa.
   */
  private async releaseExpiredLocks(eventId: string) {
    const now = new Date();
    await this.prisma.seat.updateMany({
      where: {
        section: { eventId },
        status: SeatStatus.LOCKED,
        lockedUntil: { lt: now },
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedUntil: null,
        lockedByOrderId: null,
      },
    });
  }

  /**
   * Mendapatkan struktur denah & kursi untuk publik / pembeli.
   */
  async getPublicEventSeating(slugOrId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      select: { id: true, title: true, slug: true, hasSeatingLayout: true },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (!event.hasSeatingLayout) {
      return {
        hasSeatingLayout: false,
        sections: [],
      };
    }

    // Bersihkan kursi lock yang kedaluwarsa
    await this.releaseExpiredLocks(event.id);

    const sections = await this.prisma.seatSection.findMany({
      where: { eventId: event.id },
      include: {
        ticketCategory: {
          select: {
            id: true,
            name: true,
            price: true,
            sold: true,
            quota: true,
          },
        },
        seats: {
          select: {
            id: true,
            row: true,
            col: true,
            seatNumber: true,
            status: true,
            ticketCategoryId: true,
            lockedUntil: true,
          },
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
      orderBy: { order: 'asc' },
    });

    return {
      hasSeatingLayout: true,
      eventId: event.id,
      sections,
    };
  }

  /**
   * Mendapatkan konfigurasi denah dan kursi untuk Organizer.
   */
  async getOrganizerSeating(eventId: string, userId: string) {
    await this.getOrganizerEventOrThrow(eventId, userId);
    await this.releaseExpiredLocks(eventId);

    const sections = await this.prisma.seatSection.findMany({
      where: { eventId },
      include: {
        ticketCategory: {
          select: {
            id: true,
            name: true,
            price: true,
            quota: true,
            sold: true,
          },
        },
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
      orderBy: { order: 'asc' },
    });

    return sections;
  }

  /**
   * Bulk generator kursi otomatis berdasarkan baris & kolom untuk suatu seksi.
   */
  async generateSectionSeats(eventId: string, userId: string, dto: GenerateSeatsDto) {
    const event = await this.getOrganizerEventOrThrow(eventId, userId);

    // Otomatis aktifkan hasSeatingLayout jika sebelumnya false
    if (!event.hasSeatingLayout) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { hasSeatingLayout: true },
      });
    }

    // Pastikan kategori tiket ada jika dipilih
    let ticketCatId = dto.ticketCategoryId;
    if (!ticketCatId) {
      const defaultCategory = await this.prisma.ticketCategory.findFirst({
        where: { eventId },
        orderBy: { price: 'asc' },
      });
      if (!defaultCategory) {
        throw new BadRequestException('Event belum memiliki kategori tiket. Buat kategori tiket terlebih dahulu.');
      }
      ticketCatId = defaultCategory.id;
    }

    // Buat atau cari SeatSection
    const section = await this.prisma.seatSection.create({
      data: {
        eventId,
        name: dto.sectionName,
        ticketCategoryId: ticketCatId,
        stagePosition: dto.stagePosition || 'CENTER',
      },
    });

    // Helper membuat urutan baris
    const rows = this.generateRowList(dto.rowStart, dto.rowEnd);
    const disabledSet = new Set(dto.disabledSeatNumbers || []);

    const seatsToCreate: Array<{
      sectionId: string;
      ticketCategoryId: string;
      row: string;
      col: number;
      seatNumber: string;
      status: SeatStatus;
    }> = [];

    for (const row of rows) {
      for (let col = 1; col <= dto.seatsPerRow; col++) {
        const seatNumber = `${row}-${col}`;
        const isDisabled = disabledSet.has(seatNumber);

        seatsToCreate.push({
          sectionId: section.id,
          ticketCategoryId: ticketCatId,
          row,
          col,
          seatNumber,
          status: isDisabled ? SeatStatus.DISABLED : SeatStatus.AVAILABLE,
        });
      }
    }

    await this.prisma.seat.createMany({
      data: seatsToCreate,
    });

    return this.prisma.seatSection.findUnique({
      where: { id: section.id },
      include: {
        ticketCategory: true,
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });
  }

  /**
   * Mengubah status kursi (Available <-> Disabled) oleh EO saat mengatur layout.
   */
  async toggleSeatStatus(eventId: string, seatId: string, userId: string) {
    await this.getOrganizerEventOrThrow(eventId, userId);

    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
      include: { section: true },
    });

    if (!seat || seat.section.eventId !== eventId) {
      throw new NotFoundException('Kursi tidak ditemukan');
    }

    if (seat.status === SeatStatus.BOOKED) {
      throw new BadRequestException('Kursi sudah dibeli dan tidak dapat diubah');
    }

    const nextStatus =
      seat.status === SeatStatus.DISABLED ? SeatStatus.AVAILABLE : SeatStatus.DISABLED;

    return this.prisma.seat.update({
      where: { id: seatId },
      data: { status: nextStatus },
    });
  }

  /**
   * Menghapus seksi denah beserta semua kursi di dalamnya.
   */
  async deleteSection(eventId: string, sectionId: string, userId: string) {
    await this.getOrganizerEventOrThrow(eventId, userId);

    const section = await this.prisma.seatSection.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.eventId !== eventId) {
      throw new NotFoundException('Seksi denah tidak ditemukan');
    }

    // Periksa apakah sudah ada kursi yang terlanjur dipesan
    const bookedSeatCount = await this.prisma.seat.count({
      where: { sectionId, status: SeatStatus.BOOKED },
    });

    if (bookedSeatCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus seksi ini karena sudah terdapat ${bookedSeatCount} tiket kursi yang terjual.`,
      );
    }

    await this.prisma.seatSection.delete({
      where: { id: sectionId },
    });

    return { success: true, message: 'Seksi denah berhasil dihapus' };
  }

  /**
   * Mengunci kursi sementara (10 menit) saat pembeli membuka sesi checkout.
   */
  async lockSeats(slugOrId: string, seatIds: string[], orderId?: string) {
    const event = await this.prisma.event.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    await this.releaseExpiredLocks(event.id);

    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        section: { eventId: event.id },
      },
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('Beberapa kursi yang dipilih tidak valid untuk acara ini');
    }

    // Pastikan semua kursi berstatus AVAILABLE atau terkunci oleh order yang sama
    const unavailableSeats = seats.filter(
      (s) =>
        s.status === SeatStatus.BOOKED ||
        s.status === SeatStatus.DISABLED ||
        (s.status === SeatStatus.LOCKED && s.lockedByOrderId && s.lockedByOrderId !== orderId),
    );

    if (unavailableSeats.length > 0) {
      const numbers = unavailableSeats.map((s) => s.seatNumber).join(', ');
      throw new BadRequestException(`Kursi ${numbers} sedang dipesan atau tidak tersedia.`);
    }

    // Kunci selama 10 menit
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: {
        status: SeatStatus.LOCKED,
        lockedUntil,
        lockedByOrderId: orderId || null,
      },
    });

    return {
      success: true,
      lockedCount: seatIds.length,
      lockedUntil,
    };
  }

  /**
   * Melepas kuncian kursi.
   */
  async releaseSeats(seatIds: string[], orderId?: string) {
    await this.prisma.seat.updateMany({
      where: {
        id: { in: seatIds },
        status: SeatStatus.LOCKED,
        ...(orderId ? { lockedByOrderId: orderId } : {}),
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedUntil: null,
        lockedByOrderId: null,
      },
    });

    return { success: true };
  }

  /**
   * Helper membuat deret nama baris (misal A s/d H, atau 1 s/d 10).
   */
  private generateRowList(start: string, end: string): string[] {
    const trimmedStart = start.trim().toUpperCase();
    const trimmedEnd = end.trim().toUpperCase();

    // Cek apakah angka
    const startNum = parseInt(trimmedStart, 10);
    const endNum = parseInt(trimmedEnd, 10);

    if (!isNaN(startNum) && !isNaN(endNum)) {
      const min = Math.min(startNum, endNum);
      const max = Math.min(Math.max(startNum, endNum), min + 50);
      const list: string[] = [];
      for (let i = min; i <= max; i++) {
        list.push(String(i));
      }
      return list;
    }

    // Huruf (A-Z)
    const startCode = trimmedStart.charCodeAt(0) || 65;
    const endCode = trimmedEnd.charCodeAt(0) || 65;

    const minCode = Math.min(startCode, endCode);
    const maxCode = Math.min(Math.max(startCode, endCode), minCode + 25);

    const list: string[] = [];
    for (let c = minCode; c <= maxCode; c++) {
      list.push(String.fromCharCode(c));
    }
    return list;
  }
}
