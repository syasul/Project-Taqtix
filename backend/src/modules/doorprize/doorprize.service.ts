import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoorprizeDto } from './dto/create-doorprize.dto';
import { DrawDoorprizeDto } from './dto/draw-doorprize.dto';

@Injectable()
export class DoorprizeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganizerOrThrow(userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
      include: { organizer: true },
    });
    if (member?.organizer) return member.organizer;

    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (!organizer) {
      throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
    }
    return organizer;
  }

  private async verifyEventOwnership(eventId: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.organizerId !== organizer.id) {
      throw new NotFoundException('Event tidak ditemukan atau bukan milik Anda');
    }
    return { event, organizer };
  }

  /**
   * Menambahkan item hadiah doorprize untuk event.
   */
  async createItem(eventId: string, dto: CreateDoorprizeDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.doorprizeItem.create({
      data: {
        eventId,
        name: dto.name,
        imageUrl: dto.imageUrl || null,
        quantity: dto.quantity,
        remainingQuantity: dto.quantity,
      },
    });
  }

  /**
   * Mendapatkan daftar semua hadiah doorprize pada event.
   */
  async listItems(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.doorprizeItem.findMany({
      where: { eventId },
      include: {
        winners: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Mengundi pemenang doorprize dari pengunjung yang sudah Check-In.
   */
  async drawWinner(
    eventId: string,
    itemId: string,
    dto: DrawDoorprizeDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    const item = await this.prisma.doorprizeItem.findUnique({
      where: { id: itemId },
      include: { winners: true },
    });

    if (!item || item.eventId !== eventId) {
      throw new NotFoundException('Hadiah doorprize tidak ditemukan');
    }

    if (item.remainingQuantity <= 0) {
      throw new BadRequestException('Kuantitas hadiah ini sudah habis terundi.');
    }

    // Ambil tiket yang sudah CHECKED_IN
    const checkedInTickets = await this.prisma.ticket.findMany({
      where: {
        eventId,
        status: 'CHECKED_IN',
        isBlocked: false,
      },
      include: {
        orderItem: true,
      },
    });

    if (checkedInTickets.length === 0) {
      throw new BadRequestException(
        'Belum ada pengunjung yang melakukan check-in untuk diundi.',
      );
    }

    // Filter tiket yang sudah pernah menang
    const existingWinners = await this.prisma.doorprizeWinner.findMany({
      where: {
        doorprizeItem: {
          eventId,
        },
      },
      select: { ticketId: true, doorprizeItemId: true },
    });

    const excludeAll = dto.excludeWinnersFromPreviousDraws !== false;
    let eligibleTickets = checkedInTickets;

    if (excludeAll) {
      const wonTicketIds = new Set(existingWinners.map((w) => w.ticketId));
      eligibleTickets = checkedInTickets.filter((t) => !wonTicketIds.has(t.id));
    } else {
      const wonThisItemTicketIds = new Set(
        existingWinners
          .filter((w) => w.doorprizeItemId === itemId)
          .map((w) => w.ticketId),
      );
      eligibleTickets = checkedInTickets.filter(
        (t) => !wonThisItemTicketIds.has(t.id),
      );
    }

    if (eligibleTickets.length === 0) {
      throw new BadRequestException(
        'Semua pengunjung yang check-in sudah pernah memenangkan undian.',
      );
    }

    // Random draw
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const chosenTicket = eligibleTickets[randomIndex];

    return this.prisma.$transaction(async (tx) => {
      const winner = await tx.doorprizeWinner.create({
        data: {
          doorprizeItemId: itemId,
          ticketId: chosenTicket.id,
          winnerName: chosenTicket.orderItem.attendeeName,
          drawnBy: userId,
        },
      });

      await tx.doorprizeItem.update({
        where: { id: itemId },
        data: {
          remainingQuantity: { decrement: 1 },
        },
      });

      return {
        success: true,
        winner: {
          ...winner,
          ticketId: chosenTicket.id,
          attendeeEmail: chosenTicket.orderItem.attendeeEmail,
          attendeePhone: chosenTicket.orderItem.attendeePhone,
          prizeName: item.name,
        },
      };
    });
  }

  /**
   * Mendapatkan daftar semua pemenang doorprize pada event.
   */
  async listWinners(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.doorprizeWinner.findMany({
      where: {
        doorprizeItem: {
          eventId,
        },
      },
      include: {
        doorprizeItem: true,
        ticket: {
          include: {
            orderItem: true,
          },
        },
      },
      orderBy: { drawnAt: 'desc' },
    });
  }
}
