import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreatePosTransactionDto } from './dto/create-pos-transaction.dto';
import * as crypto from 'crypto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

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

  private async generateQrPayload(ticketId: string, eventId: string) {
    const qrSecret =
      this.configService.get<string>('QR_SIGNING_SECRET') ||
      this.configService.get<string>('QR_SECRET') ||
      'super-secret-qr-key-change-me';

    return this.jwtService.signAsync(
      {
        ticketId,
        eventId,
        type: 'audience',
        nonce: crypto.randomBytes(8).toString('hex'),
      },
      { secret: qrSecret },
    );
  }

  /**
   * Membuat transaksi POS on-site.
   */
  async createTransaction(
    eventId: string,
    dto: CreatePosTransactionDto,
    cashierUserId: string,
  ) {
    await this.verifyEventOwnership(eventId, cashierUserId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Daftar item belanja POS tidak boleh kosong.');
    }

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const ticketItemsToProcess: {
        ticketCategoryId: string;
        name: string;
        qty: number;
        unitPrice: number;
      }[] = [];

      const facilityItemsToProcess: {
        facilityId: string;
        name: string;
        qty: number;
        unitPrice: number;
      }[] = [];

      // 1. Validasi and lock kuota
      for (const item of dto.items) {
        const itemTotal = item.unitPrice * item.qty;
        totalAmount += itemTotal;

        if (item.type === 'ticket') {
          const cat = await tx.ticketCategory.findUnique({
            where: { id: item.refId },
          });

          if (!cat || cat.eventId !== eventId) {
            throw new BadRequestException(`Kategori tiket "${item.name}" tidak ditemukan`);
          }

          if (cat.quota - cat.sold < item.qty) {
            throw new BadRequestException(
              `Kuota tiket "${cat.name}" tidak mencukupi (sisa ${cat.quota - cat.sold})`,
            );
          }

          await tx.ticketCategory.update({
            where: { id: cat.id },
            data: { sold: { increment: item.qty } },
          });

          ticketItemsToProcess.push({
            ticketCategoryId: cat.id,
            name: cat.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
          });
        } else if (item.type === 'facility') {
          const fac = await tx.eventFacility.findUnique({
            where: { id: item.refId },
          });

          if (!fac || fac.eventId !== eventId) {
            throw new BadRequestException(`Fasilitas "${item.name}" tidak ditemukan`);
          }

          if (fac.quota !== null && fac.quota - fac.sold < item.qty) {
            throw new BadRequestException(
              `Kuota fasilitas "${fac.name}" tidak mencukupi (sisa ${fac.quota - fac.sold})`,
            );
          }

          await tx.eventFacility.update({
            where: { id: fac.id },
            data: { sold: { increment: item.qty } },
          });

          facilityItemsToProcess.push({
            facilityId: fac.id,
            name: fac.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
          });
        }
      }

      // 2. Buat PosTransaction record
      const posTx = await tx.posTransaction.create({
        data: {
          eventId,
          items: dto.items as any,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          cashierId: cashierUserId,
          buyerName: dto.buyerName || 'Walk-in Buyer',
          buyerPhone: dto.buyerPhone || null,
        },
      });

      // 3. Jika bayar Cash, rekam ke CashTransaction untuk rekonsiliasi kas
      if (dto.paymentMethod === 'cash') {
        await tx.cashTransaction.create({
          data: {
            eventId,
            type: ticketItemsToProcess.length > 0 ? 'ticket_sale' : 'other',
            amount: totalAmount,
            relatedPosTransactionId: posTx.id,
            recordedBy: cashierUserId,
            note: `Transaksi POS #${posTx.id.substring(0, 8)} (${dto.buyerName || 'Walk-in'})`,
          },
        });
      }

      // 4. Jika ada pembelian tiket, buat Order + OrderItem + Ticket seketika (PAID)
      const generatedTickets: any[] = [];

      if (ticketItemsToProcess.length > 0) {
        // Find or create cashier buyer user
        let buyerUser = await tx.user.findFirst({
          where: { email: `pos-${eventId}@taqtix.internal` },
        });

        if (!buyerUser) {
          buyerUser = await tx.user.create({
            data: {
              email: `pos-${eventId}@taqtix.internal`,
              passwordHash: '',
              role: 'buyer',
            },
          });
        }

        const newOrder = await tx.order.create({
          data: {
            buyerId: buyerUser.id,
            eventId,
            totalAmount,
            discountAmount: 0,
            status: 'PAID',
            expiredAt: new Date(),
          },
        });

        for (const item of ticketItemsToProcess) {
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              ticketCategoryId: item.ticketCategoryId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              attendeeName: dto.buyerName || 'Walk-in Attendee',
              attendeeEmail: `pos-${posTx.id.substring(0, 8)}@taqtix.internal`,
              attendeePhone: dto.buyerPhone || '',
            },
          });

          for (let i = 0; i < item.qty; i++) {
            const ticketId = crypto.randomUUID();
            const qrPayload = await this.generateQrPayload(ticketId, eventId);

            const ticket = await tx.ticket.create({
              data: {
                id: ticketId,
                orderItemId: orderItem.id,
                eventId,
                qrPayload,
                status: 'VALID',
              },
            });

            generatedTickets.push({
              ticketId: ticket.id,
              categoryName: item.name,
              attendeeName: dto.buyerName || 'Walk-in Attendee',
              qrPayload: ticket.qrPayload,
            });
          }
        }
      }

      return {
        success: true,
        posTransaction: posTx,
        tickets: generatedTickets,
      };
    });
  }

  /**
   * Mendapatkan riwayat transaksi POS.
   */
  async listTransactions(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.posTransaction.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mendapatkan summary penjualan POS.
   */
  async getSummary(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const transactions = await this.prisma.posTransaction.findMany({
      where: { eventId },
    });

    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);

    const byMethod = {
      cash: transactions
        .filter((t) => t.paymentMethod === 'cash')
        .reduce((acc, t) => acc + t.totalAmount, 0),
      qris: transactions
        .filter((t) => t.paymentMethod === 'qris')
        .reduce((acc, t) => acc + t.totalAmount, 0),
      debit: transactions
        .filter((t) => t.paymentMethod === 'debit')
        .reduce((acc, t) => acc + t.totalAmount, 0),
    };

    return {
      totalRevenue,
      totalTransactions: transactions.length,
      byPaymentMethod: byMethod,
    };
  }
}
