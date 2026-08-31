import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';

@Injectable()
export class CashService {
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
   * Catat transaksi cash manual untuk event tertentu.
   */
  async recordCash(eventId: string, dto: CreateCashTransactionDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.cashTransaction.create({
      data: {
        eventId,
        type: dto.type,
        amount: dto.amount,
        relatedOrderId: dto.relatedOrderId || null,
        relatedPosTransactionId: dto.relatedPosTransactionId || null,
        recordedBy: userId,
        note: dto.note || null,
      },
    });
  }

  /**
   * Mendapatkan daftar transaksi cash untuk event tertentu dengan total summary.
   */
  async getEventCash(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const transactions = await this.prisma.cashTransaction.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    const totalCashIn = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    const breakdown = {
      ticket_sale: transactions
        .filter((t) => t.type === 'ticket_sale')
        .reduce((acc, t) => acc + t.amount, 0),
      merchandise_sale: transactions
        .filter((t) => t.type === 'merchandise_sale')
        .reduce((acc, t) => acc + t.amount, 0),
      facility_sale: transactions
        .filter((t) => t.type === 'facility_sale')
        .reduce((acc, t) => acc + t.amount, 0),
      other: transactions
        .filter((t) => t.type === 'other')
        .reduce((acc, t) => acc + t.amount, 0),
    };

    return {
      data: transactions,
      meta: {
        totalCashIn,
        breakdown,
        totalCount: transactions.length,
      },
    };
  }

  /**
   * Mendapatkan ringkasan kas lintas seluruh event untuk organisasi.
   */
  async getOrganizerCashSummary(userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const events = await this.prisma.event.findMany({
      where: { organizerId: organizer.id },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        cashTransactions: true,
      },
    });

    let grandTotalCash = 0;
    const eventSummaries = events.map((ev) => {
      const totalCash = ev.cashTransactions.reduce((acc, t) => acc + t.amount, 0);
      grandTotalCash += totalCash;
      return {
        eventId: ev.id,
        eventTitle: ev.title,
        status: ev.status,
        startDate: ev.startDate,
        transactionCount: ev.cashTransactions.length,
        totalCash,
      };
    });

    return {
      grandTotalCash,
      totalEvents: events.length,
      events: eventSummaries,
    };
  }
}
