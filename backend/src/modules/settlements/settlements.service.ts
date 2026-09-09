import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, EventStatus } from '@prisma/client';

@Injectable()
export class SettlementsService implements OnModuleInit {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Jalankan pengecekan kalkulasi 10 detik setelah aplikasi start
    setTimeout(() => {
      this.calculatePendingSettlements().catch((err) =>
        console.error('[SettlementsService] Error running initial calculation:', err),
      );
    }, 10000);

    // Jalankan scheduler berkala setiap 15 menit
    this.timer = setInterval(() => {
      this.calculatePendingSettlements().catch((err) =>
        console.error('[SettlementsService] Error running scheduled calculation:', err),
      );
    }, 15 * 60 * 1000);
  }

  /**
   * Menghitung dan membuat record settlement untuk seluruh event yang telah selesai (ended)
   * Formula: grossRevenue - platformFee - affiliateCommissionTotal = netAmount
   */
  async calculatePendingSettlements() {
    const now = new Date();

    // Cari event yang sudah ENDED atau endDate sudah lewat, dan belum memiliki record Settlement
    const endedEvents = await this.prisma.event.findMany({
      where: {
        OR: [
          { status: EventStatus.ENDED },
          { endDate: { lte: now } },
        ],
        settlements: {
          none: {},
        },
      },
      include: {
        organizer: true,
        orders: {
          where: { status: OrderStatus.PAID },
        },
        partners: true,
      },
    });

    if (endedEvents.length === 0) {
      return { processed: 0, settlements: [] };
    }

    const createdSettlements: any[] = [];

    for (const event of endedEvents) {
      // 1. Gross revenue dari semua order PAID
      const grossRevenue = event.orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      // 2. Total komisi affiliate dari semua partner event
      const affiliateCommissionTotal = event.partners.reduce(
        (sum, partner) => sum + partner.commissionEarned,
        0,
      );

      // 3. Platform fee (persentase berdasarkan paket langganan organizer)
      let feeRate = 0.05; // 5% untuk starter
      if (event.organizer?.plan === 'pro') feeRate = 0.04; // 4% untuk pro
      if (event.organizer?.plan === 'enterprise') feeRate = 0.03; // 3% untuk enterprise

      const platformFee = Math.round(grossRevenue * feeRate);

      // 4. Net amount yang ditransfer ke rekening organizer
      const netAmount = Math.max(
        0,
        grossRevenue - platformFee - affiliateCommissionTotal,
      );

      // Buat record Settlement berstatus 'pending'
      const settlement = await this.prisma.settlement.create({
        data: {
          organizerId: event.organizerId,
          eventId: event.id,
          grossRevenue,
          platformFee,
          affiliateCommissionTotal,
          netAmount,
          status: 'pending',
        },
      });

      // Pastikan status event diupdate menjadi ENDED jika sebelumnya belum
      if (event.status !== EventStatus.ENDED) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { status: EventStatus.ENDED },
        });
      }

      console.log(
        `[Settlement Auto-Calculation] Event "${event.title}" diselesaikan. Gross: Rp${grossRevenue.toLocaleString('id-ID')}, Platform Fee: Rp${platformFee.toLocaleString('id-ID')}, Affiliate: Rp${affiliateCommissionTotal.toLocaleString('id-ID')}, Net: Rp${netAmount.toLocaleString('id-ID')}`,
      );

      createdSettlements.push(settlement);
    }

    return {
      processed: createdSettlements.length,
      settlements: createdSettlements,
    };
  }

  /**
   * Mendapatkan seluruh daftar settlement yang perlu diproses
   */
  async getSettlements() {
    return this.prisma.settlement.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            bankAccount: true,
            phone: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            endDate: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Menandai settlement sudah ditransfer ke organizer (Admin)
   */
  async markSettlementPaid(settlementId: string, adminId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException('Settlement tidak ditemukan');
    }

    if (settlement.status === 'paid') {
      throw new BadRequestException('Settlement ini sudah berstatus paid');
    }

    const updated = await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidBy: adminId,
      },
    });

    // Catat ke log audit
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'mark_settlement_paid',
        targetId: settlementId,
        targetType: 'settlement',
        details: {
          netAmount: settlement.netAmount,
          eventId: settlement.eventId,
          organizerId: settlement.organizerId,
        },
      },
    });

    return updated;
  }
}
