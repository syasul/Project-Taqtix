import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, EventStatus } from '@prisma/client';
import Redis from 'ioredis';

@Injectable()
export class DashboardService implements OnModuleInit {
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
      this.redis.on('error', (err) => {
        // Silently log errors to prevent crashing when Redis is not running locally
        console.warn('Redis client error:', err.message);
      });
    } catch (err) {
      console.warn('Gagal inisialisasi Redis client:', err);
    }
  }

  /**
   * Helper untuk memastikan bahwa user adalah pemilik event terkait.
   */
  private async verifyEventOwnership(eventId: string, organizerUserId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId: organizerUserId, status: 'active' },
    });
    let organizerId = member?.organizerId;

    if (!organizerId) {
      const organizer = await this.prisma.organizer.findUnique({
        where: { userId: organizerUserId },
      });
      if (!organizer) {
        throw new ForbiddenException('Akses ditolak: Anda bukan organizer');
      }
      organizerId = organizer.id;
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(
        'Akses ditolak: Anda bukan pemilik event ini',
      );
    }

    return event;
  }

  /**
   * Helper untuk mendapatkan organizer ID dari user ID.
   */
  private async getOrganizerId(userId: string): Promise<string> {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
    });
    if (member) return member.organizerId;

    const org = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (!org) {
      throw new ForbiddenException('Profil organizer tidak ditemukan');
    }
    return org.id;
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
   * Executive Dashboard Overview untuk Multi-Event (cached 5 menit).
   */
  async getOverview(userId: string) {
    const cacheKey = `dashboard:overview:${userId}`;
    if (this.redis) {
      try {
        const cachedData = await this.redis.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      } catch (err) {
        console.warn('Redis read failed:', err);
      }
    }

    const result = await this.calculateOverview(userId);

    if (this.redis) {
      try {
        await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
      } catch (err) {
        console.warn('Redis write failed:', err);
      }
    }

    return result;
  }

  private async calculateOverview(userId: string) {
    const organizerId = await this.getOrganizerId(userId);

    const events = await this.prisma.event.findMany({
      where: { organizerId },
    });

    const eventIds = events.map((e) => e.id);

    const paidOrders = await this.prisma.order.findMany({
      where: {
        eventId: { in: eventIds },
        status: OrderStatus.PAID,
      },
      include: {
        orderItems: true,
      },
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const ticketsSold = paidOrders.reduce(
      (sum, o) => sum + o.orderItems.reduce((acc, item) => acc + item.qty, 0),
      0,
    );

    // Event berjalan hari ini (published dan sekarang di antara start & end)
    const now = new Date();
    const runningEventsCount = await this.prisma.event.count({
      where: {
        organizerId,
        status: EventStatus.PUBLISHED,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Hitung trends pendapatan per bulan (6 bulan terakhir)
    const monthlyTrends: Record<string, number> = {};
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      months.push(label);
      monthlyTrends[label] = 0;
    }

    for (const order of paidOrders) {
      const orderMonth = order.createdAt.toLocaleString('id-ID', {
        month: 'short',
        year: '2-digit',
      });
      if (monthlyTrends[orderMonth] !== undefined) {
        monthlyTrends[orderMonth] += order.totalAmount;
      }
    }

    const trends = months.map((month) => ({
      month,
      revenue: monthlyTrends[month],
    }));

    return {
      totalRevenue,
      ticketsSold,
      activeEvents: runningEventsCount,
      trends,
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

  // --- ANALYTICS SUB-REPORTS ---

  async getSalesAnalytics(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const paidOrderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          eventId,
          status: OrderStatus.PAID,
        },
      },
      include: {
        ticketCategory: true,
      },
    });

    // byCategory
    const categoryMap = new Map<string, { categoryName: string; sold: number; revenue: number }>();
    for (const item of paidOrderItems) {
      const catName = item.ticketCategory.name;
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { categoryName: catName, sold: 0, revenue: 0 });
      }
      const data = categoryMap.get(catName)!;
      data.sold += item.qty;
      data.revenue += item.qty * item.unitPrice;
    }

    // byDay
    const dayMap = new Map<string, { date: string; sold: number; revenue: number }>();
    for (const item of paidOrderItems) {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { date: dateStr, sold: 0, revenue: 0 });
      }
      const data = dayMap.get(dateStr)!;
      data.sold += item.qty;
      data.revenue += item.qty * item.unitPrice;
    }

    const byCategory = Array.from(categoryMap.values());
    const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      byCategory,
      byDay,
    };
  }

  async getDistributionAnalytics(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const paidOrders = await this.prisma.order.findMany({
      where: {
        eventId,
        status: OrderStatus.PAID,
      },
    });

    const channels: Record<string, { channel: string; buyers: number; revenue: number }> = {
      organic: { channel: 'organic', buyers: 0, revenue: 0 },
      affiliate: { channel: 'affiliate', buyers: 0, revenue: 0 },
    };

    for (const order of paidOrders) {
      let ch = 'organic';
      if (order.partnerId) {
        ch = 'affiliate';
      } else if (order.utmSource) {
        ch = order.utmSource;
      }

      if (!channels[ch]) {
        channels[ch] = { channel: ch, buyers: 0, revenue: 0 };
      }

      channels[ch].buyers += 1;
      channels[ch].revenue += order.totalAmount;
    }

    return {
      byChannel: Array.from(Object.values(channels)),
    };
  }

  async getAudienceAnalytics(eventId: string, userId: string) {
    const event = await this.verifyEventOwnership(eventId, userId);
    const organizerId = event.organizerId;

    const paidOrderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          eventId,
          status: OrderStatus.PAID,
        },
      },
    });

    const uniqueEmails = Array.from(new Set(paidOrderItems.map((o) => o.attendeeEmail)));
    const totalBuyers = uniqueEmails.length;

    let newBuyersCount = 0;
    let returningBuyersCount = 0;

    for (const email of uniqueEmails) {
      // Periksa apakah buyer pernah memesan di event lain buatan organizer yang sama
      const prevOrderCount = await this.prisma.order.count({
        where: {
          eventId: { not: eventId },
          event: { organizerId },
          status: OrderStatus.PAID,
          orderItems: {
            some: {
              attendeeEmail: email,
            },
          },
        },
      });

      if (prevOrderCount > 0) {
        returningBuyersCount++;
      } else {
        newBuyersCount++;
      }
    }

    // Top Cities
    const cityCounts = await this.prisma.orderItem.groupBy({
      by: ['city'],
      where: {
        order: {
          eventId,
          status: OrderStatus.PAID,
        },
        city: { not: null },
      },
      _count: {
        city: true,
      },
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
      take: 5,
    });

    const topCities = cityCounts.map((c) => ({
      city: c.city || 'Lainnya',
      count: c._count.city,
    }));

    const repeatPurchaseRate = totalBuyers > 0 ? parseFloat((returningBuyersCount / totalBuyers).toFixed(2)) : 0.0;

    return {
      totalBuyers,
      newBuyers: newBuyersCount,
      returningBuyers: returningBuyersCount,
      topCities,
      repeatPurchaseRate,
    };
  }

  async getPerformanceAnalytics(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const landingPageViews = await this.prisma.trackEvent.count({
      where: { eventId, type: 'page_view' },
    });

    const checkoutStarted = await this.prisma.trackEvent.count({
      where: { eventId, type: 'checkout_start' },
    });

    const allOrders = await this.prisma.order.findMany({
      where: { eventId },
      include: {
        payment: true,
      },
    });

    const paidOrders = allOrders.filter((o) => o.status === OrderStatus.PAID);
    const checkoutCompleted = paidOrders.length;

    // Hitung rata-rata waktu checkout (selisih order.createdAt dan payment.paidAt)
    let totalSeconds = 0;
    let validPaymentCount = 0;

    for (const order of paidOrders) {
      if (order.payment && order.payment.paidAt) {
        const diff = (order.payment.paidAt.getTime() - order.createdAt.getTime()) / 1000;
        if (diff > 0) {
          totalSeconds += diff;
          validPaymentCount++;
        }
      }
    }

    const avgCheckoutTimeSeconds = validPaymentCount > 0 ? Math.round(totalSeconds / validPaymentCount) : 0;

    const totalOrdersCount = allOrders.length;
    const refundedOrdersCount = allOrders.filter((o) => o.status === OrderStatus.REFUNDED).length;
    const refundRate = totalOrdersCount > 0 ? parseFloat((refundedOrdersCount / totalOrdersCount).toFixed(3)) : 0.0;

    const conversionRate = landingPageViews > 0 ? parseFloat((checkoutCompleted / landingPageViews).toFixed(3)) : 0.0;

    return {
      landingPageViews,
      checkoutStarted,
      checkoutCompleted,
      conversionRate,
      avgCheckoutTimeSeconds,
      refundRate,
    };
  }

  // --- GROWTH DASHBOARD ---

  async recordAdSpend(
    eventId: string,
    dto: { channel: string; amount: number; periodStart: string; periodEnd: string },
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.adSpend.create({
      data: {
        eventId,
        channel: dto.channel,
        amount: dto.amount,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        inputBy: userId,
      },
    });
  }

  async getGrowthDashboard(eventId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    // Ambil semua ad spend
    const adSpends = await this.prisma.adSpend.findMany({
      where: { eventId },
    });

    // Group spend by channel
    const spendMap = new Map<string, number>();
    for (const spend of adSpends) {
      spendMap.set(spend.channel, (spendMap.get(spend.channel) || 0) + spend.amount);
    }

    // Ambil orders paid
    const paidOrders = await this.prisma.order.findMany({
      where: { eventId, status: OrderStatus.PAID },
    });

    // Group revenue by utmSource
    const revenueMap = new Map<string, number>();
    for (const order of paidOrders) {
      if (order.utmSource) {
        revenueMap.set(order.utmSource, (revenueMap.get(order.utmSource) || 0) + order.totalAmount);
      }
    }

    const channelsList = Array.from(spendMap.keys());
    // Gabungkan dengan channels yang punya revenue
    const allChannels = Array.from(new Set([...channelsList, ...Array.from(revenueMap.keys())]));

    const channels = allChannels.map((ch) => {
      const spend = spendMap.get(ch) || 0;
      const revenue = revenueMap.get(ch) || 0;
      const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : null;
      return {
        channel: ch,
        spend,
        revenue,
        roas,
      };
    });

    // topAffiliates: top 5 partners by revenue
    const topPartners = await this.prisma.partner.findMany({
      where: { eventId },
      orderBy: {
        revenueGenerated: 'desc',
      },
      take: 5,
    });

    const topAffiliates = topPartners.map((p) => ({
      partnerId: p.id,
      name: p.name,
      revenue: p.revenueGenerated,
      conversionRate: p.clicks > 0 ? parseFloat((p.conversions / p.clicks).toFixed(2)) : 0.0,
    }));

    return {
      channels,
      topAffiliates,
    };
  }

  /**
   * Mencatat data traffic pengunjung (fire and forget tracking).
   */
  async trackEvent(eventId: string, type: string) {
    if (type !== 'page_view' && type !== 'checkout_start') {
      throw new BadRequestException('Event type invalid');
    }

    return this.prisma.trackEvent.create({
      data: {
        eventId,
        type,
      },
    });
  }
}
