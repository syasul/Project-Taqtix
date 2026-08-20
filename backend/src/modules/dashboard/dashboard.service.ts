import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper untuk memastikan bahwa user adalah pemilik event terkait.
   */
  private async verifyEventOwnership(eventId: string, organizerUserId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId: organizerUserId },
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

    return event;
  }

  /**
   * Mendapatkan rangkuman metrik dashboard organizer (sales, revenue, ticket sold).
   */
  async getEventDashboard(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    // Ambil order berstatus PAID
    const paidOrders = await this.prisma.order.findMany({
      where: { eventId, status: OrderStatus.PAID },
      include: {
        orderItems: true,
      },
    });

    // Ambil order berstatus PENDING
    const pendingOrdersCount = await this.prisma.order.count({
      where: { eventId, status: OrderStatus.PENDING },
    });

    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const ticketsSold = paidOrders.reduce(
      (acc, o) => acc + o.orderItems.reduce((sum, item) => sum + item.qty, 0),
      0,
    );

    return {
      eventId,
      totalRevenue,
      ticketsSold,
      completedTransactions: paidOrders.length,
      pendingTransactions: pendingOrdersCount,
    };
  }

  /**
   * Mendapatkan daftar database buyer untuk event tertentu.
   */
  async getBuyers(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    const orders = await this.prisma.order.findMany({
      where: { eventId, status: OrderStatus.PAID },
      include: {
        orderItems: {
          include: {
            ticketCategory: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => {
      const firstItem = o.orderItems[0];
      return {
        orderId: o.id,
        buyerName: firstItem?.attendeeName || 'Guest',
        buyerEmail: firstItem?.attendeeEmail || '',
        buyerPhone: firstItem?.attendeePhone || '',
        totalAmount: o.totalAmount,
        purchaseDate: o.createdAt,
        items: o.orderItems.map((item) => ({
          ticketCategory: item.ticketCategory.name,
          qty: item.qty,
          price: item.unitPrice,
        })),
      };
    });
  }

  /**
   * Menghasilkan string berformat CSV untuk diekspor dari data buyer.
   */
  async getBuyersCsv(eventId: string, organizerUserId: string) {
    const buyers = await this.getBuyers(eventId, organizerUserId);

    let csvContent =
      'Nama,Email,No. WhatsApp,Total Bayar (Rp),Tanggal Pembelian\n';

    for (const b of buyers) {
      const cleanName = b.buyerName.replace(/"/g, '""');
      const cleanEmail = b.buyerEmail.replace(/"/g, '""');
      const phone = b.buyerPhone || '';
      const dateStr = b.purchaseDate.toISOString();

      csvContent += `"${cleanName}","${cleanEmail}","${phone}",${b.totalAmount},"${dateStr}"\n`;
    }

    return csvContent;
  }

  /**
   * Menganalisis kinerja channel pemasaran (Organik vs Afiliasi).
   */
  async getChannelPerformance(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    // 1. Dapatkan agregasi data afiliasi
    const affiliates = await this.prisma.partner.findMany({
      where: { eventId },
      include: {
        orders: {
          where: { status: OrderStatus.PAID },
        },
      },
    });

    const affiliatePerformance = affiliates.map((aff) => {
      const salesCount = aff.orders.length;
      const totalRevenue = aff.orders.reduce(
        (sum, o) => sum + o.totalAmount,
        0,
      );

      return {
        partnerId: aff.id,
        partnerName: aff.name,
        partnerType: aff.type,
        clicks: aff.clicks,
        salesCount,
        revenueGenerated: totalRevenue,
        commissionEarned: aff.commissionEarned,
        conversionRate:
          aff.clicks > 0
            ? parseFloat(((salesCount / aff.clicks) * 100).toFixed(2))
            : 0.0,
      };
    });

    // 2. Dapatkan data organik (tanpa kode partner afiliasi)
    const organicOrders = await this.prisma.order.findMany({
      where: {
        eventId,
        status: OrderStatus.PAID,
        partnerId: null,
      },
    });

    const organicRevenue = organicOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );

    return {
      eventId,
      channels: {
        organic: {
          salesCount: organicOrders.length,
          revenueGenerated: organicRevenue,
        },
        affiliates: affiliatePerformance,
      },
    };
  }
}
