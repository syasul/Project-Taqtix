import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementsService } from '../settlements/settlements.service';
import { PaymentsService } from '../payments/payments.service';
import { UpdateEventFeeDto } from './dto/update-event-fee.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementsService: SettlementsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Mendapatkan semua data organizer
   */
  async getOrganizers() {
    const orgs = await this.prisma.organizer.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      email: o.user.email,
      phone: o.phone || '08123456789',
      status: o.status || 'pending',
      plan: o.plan,
      segment: o.segment,
      bankAccount: o.bankAccount,
      internetFee: o.internetFee ?? 0,
      createdAt: o.createdAt.toISOString(),
      approvedAt: o.approvedAt ? o.approvedAt.toISOString() : null,
      approvedBy: o.approvedBy || null,
      eventCount: o._count.events,
    }));
  }

  /**
   * Membuat Organizer / EO baru via Admin
   */
  async createOrganizer(dto: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    segment?: string;
    plan?: string;
    bankAccount?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar dalam sistem.');
    }

    const password = dto.password || 'Taqtix2026!';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'organizer',
      },
    });

    const slug =
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const organizer = await this.prisma.organizer.create({
      data: {
        userId: user.id,
        name: dto.name,
        slug,
        phone: dto.phone || null,
        segment: dto.segment || 'event_builder',
        plan: dto.plan || 'starter',
        bankAccount: dto.bankAccount || '',
        status: 'active',
        approvedAt: new Date(),
        approvedBy: 'mainadmin',
      },
    });

    await this.prisma.organizerMember.create({
      data: {
        organizerId: organizer.id,
        userId: user.id,
        email: user.email,
        role: 'owner',
        status: 'active',
        invitedBy: user.id,
        joinedAt: new Date(),
      },
    });

    return {
      id: organizer.id,
      name: organizer.name,
      email: user.email,
      phone: organizer.phone || '08123456789',
      slug: organizer.slug,
      plan: organizer.plan,
      segment: organizer.segment,
      bankAccount: organizer.bankAccount,
      status: organizer.status,
      createdAt: organizer.createdAt.toISOString(),
      eventCount: 0,
    };
  }

  /**
   * Menghapus Organizer
   */
  async deleteOrganizer(id: string) {
    const org = await this.prisma.organizer.findUnique({
      where: { id },
    });
    if (!org) {
      throw new NotFoundException('Organizer tidak ditemukan');
    }

    await this.prisma.organizer.delete({
      where: { id },
    });

    await this.prisma.user
      .delete({
        where: { id: org.userId },
      })
      .catch(() => {});

    return { id, message: 'Organizer berhasil dihapus' };
  }

  /**
   * Mengubah segment dan plan dari organizer.
   */
  async updateOrganizerSegmentAndPlan(
    organizerId: string,
    dto: UpdateOrganizerDto,
  ) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { id: organizerId },
    });
    if (!organizer) {
      throw new NotFoundException('Organizer tidak ditemukan');
    }

    return this.prisma.organizer.update({
      where: { id: organizerId },
      data: {
        name: dto.name !== undefined ? dto.name : organizer.name,
        phone: dto.phone !== undefined ? dto.phone : organizer.phone,
        status: dto.status !== undefined ? dto.status : organizer.status,
        segment: dto.segment !== undefined ? dto.segment : organizer.segment,
        plan: dto.plan !== undefined ? dto.plan : organizer.plan,
        bankAccount: dto.bankAccount !== undefined ? dto.bankAccount : organizer.bankAccount,
        internetFee:
          dto.internetFee !== undefined
            ? dto.internetFee
            : organizer.internetFee,
        planStartedAt:
          dto.plan && dto.plan !== organizer.plan
            ? new Date()
            : organizer.planStartedAt,
        planExpiresAt: dto.planExpiresAt
          ? new Date(dto.planExpiresAt)
          : organizer.planExpiresAt,
      },
    });
  }

  /**
   * Membuat Partner Afiliasi baru
   */
  async createPartner(dto: {
    name: string;
    eventId: string;
    type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
    uniqueCode: string;
    promoCode?: string;
    commissionType?: string;
    commissionValue?: number;
    email?: string;
    password?: string;
    idCardNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  }) {
    let passwordHash = undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.partner.create({
      data: {
        eventId: dto.eventId,
        name: dto.name,
        type: dto.type || 'COMMUNITY',
        uniqueCode: dto.uniqueCode.toUpperCase(),
        promoCode: dto.promoCode ? dto.promoCode.toUpperCase() : null,
        commissionType: dto.commissionType || 'percentage',
        commissionValue: dto.commissionValue ?? 10.0,
        email: dto.email || null,
        passwordHash,
        idCardNumber: dto.idCardNumber || null,
        bankName: dto.bankName || null,
        bankAccountNumber: dto.bankAccountNumber || null,
        bankAccountName: dto.bankAccountName || null,
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  /**
   * Memperbarui Partner Afiliasi
   */
  async updatePartner(
    partnerId: string,
    dto: {
      name?: string;
      eventId?: string;
      type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
      uniqueCode?: string;
      promoCode?: string;
      commissionType?: string;
      commissionValue?: number;
      email?: string;
      idCardNumber?: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountName?: string;
    },
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) {
      throw new NotFoundException('Partner tidak ditemukan');
    }

    return this.prisma.partner.update({
      where: { id: partnerId },
      data: {
        name: dto.name ?? partner.name,
        eventId: dto.eventId ?? partner.eventId,
        type: dto.type ?? partner.type,
        uniqueCode: dto.uniqueCode
          ? dto.uniqueCode.toUpperCase()
          : partner.uniqueCode,
        promoCode:
          dto.promoCode !== undefined
            ? dto.promoCode?.toUpperCase()
            : partner.promoCode,
        commissionType: dto.commissionType ?? partner.commissionType,
        commissionValue: dto.commissionValue ?? partner.commissionValue,
        email: dto.email ?? partner.email,
        idCardNumber:
          dto.idCardNumber !== undefined
            ? dto.idCardNumber
            : partner.idCardNumber,
        bankName: dto.bankName !== undefined ? dto.bankName : partner.bankName,
        bankAccountNumber:
          dto.bankAccountNumber !== undefined
            ? dto.bankAccountNumber
            : partner.bankAccountNumber,
        bankAccountName:
          dto.bankAccountName !== undefined
            ? dto.bankAccountName
            : partner.bankAccountName,
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  /**
   * Menghapus Partner
   */
  async deletePartner(id: string) {
    const p = await this.prisma.partner.findUnique({
      where: { id },
    });
    if (!p) {
      throw new NotFoundException('Partner tidak ditemukan');
    }
    await this.prisma.partner.delete({
      where: { id },
    });
    return { id, message: 'Partner berhasil dihapus' };
  }

  /**
   * Menerima kiriman lead baru dari website publik.
   */
  async createLead(dto: {
    name: string;
    organizationName: string;
    email: string;
    phone: string;
    message: string;
  }) {
    return this.prisma.enterpriseLead.create({
      data: {
        name: dto.name,
        organizationName: dto.organizationName,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        status: 'new',
      },
    });
  }

  /**
   * Mendapatkan daftar semua leads.
   */
  async getLeads() {
    return this.prisma.enterpriseLead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mengubah status pipeline lead.
   */
  async updateLeadStatus(leadId: string, status: string) {
    const lead = await this.prisma.enterpriseLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      throw new NotFoundException('Lead tidak ditemukan');
    }

    return this.prisma.enterpriseLead.update({
      where: { id: leadId },
      data: { status },
    });
  }

  /**
   * Menugaskan admin penanggung jawab lead.
   */
  async assignLead(leadId: string, adminId: string) {
    const lead = await this.prisma.enterpriseLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      throw new NotFoundException('Lead tidak ditemukan');
    }

    return this.prisma.enterpriseLead.update({
      where: { id: leadId },
      data: { assignedTo: adminId },
    });
  }

  /**
   * Rekap billing masa aktif langganan organizer.
   */
  async getBillingOversight() {
    const organizers = await this.prisma.organizer.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizers.map((org) => {
      const now = new Date();
      let status = 'active';
      if (org.planExpiresAt && org.planExpiresAt < now) {
        status = 'expired';
      }

      return {
        id: org.id,
        name: org.name,
        email: org.user.email,
        plan: org.plan,
        segment: org.segment || 'event_builder',
        status,
        planStartedAt: org.planStartedAt,
        planExpiresAt: org.planExpiresAt,
      };
    });
  }

  /**
   * Rekap pengawasan performa partner afiliasi secara global.
   */
  async getPartnersOversight() {
    return this.prisma.partner.findMany({
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { revenueGenerated: 'desc' },
    });
  }

  /**
   * Mendapatkan daftar semua event untuk moderasi admin
   */
  async getEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        organizer: true,
        ticketCategories: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      organizerName: e.organizer.name,
      location: e.location,
      status: e.status.toLowerCase(),
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      ticketsSold: e.ticketCategories.reduce((s, tc) => s + tc.sold, 0),
      quota: e.ticketCategories.reduce((s, tc) => s + tc.quota, 0),
      allowTicketTransfer: e.allowTicketTransfer ?? true,
      internetFee: e.internetFee ?? 0,
      organizerInternetFee: e.organizer.internetFee ?? 0,
      ticketCategories: e.ticketCategories.map((tc) => ({
        id: tc.id,
        name: tc.name,
        price: tc.price,
        quota: tc.quota,
        sold: tc.sold,
        ticketPerPackage: tc.ticketPerPackage,
        internetFee: tc.internetFee,
      })),
    }));
  }

  /**
   * Menyetujui event untuk tayang di platform
   */
  async approveEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'PUBLISHED' },
    });
  }

  /**
   * Menolak event
   */
  async rejectEvent(eventId: string, reason?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Ringkasan platform: total organizer, total event, total revenue, total fee terkumpul
   */
  async getDashboard() {
    const [
      totalOrganizers,
      activeOrganizers,
      pendingApprovals,
      totalEvents,
      publishedEvents,
      paidOrders,
    ] = await Promise.all([
      this.prisma.organizer.count(),
      this.prisma.organizer.count({ where: { status: 'active' } }),
      this.prisma.organizer.count({ where: { status: 'pending' } }),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.order.findMany({
        where: { status: 'PAID' },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformFee = Math.round(totalRevenue * 0.05); // 5% platform fee standar

    // Hitung pending settlements jika tabel settlement ada
    let pendingSettlements = 0;
    try {
      pendingSettlements = await this.prisma.settlement.count({
        where: { status: 'pending' },
      });
    } catch {}

    const metrics = {
      activeOrganizers,
      totalOrganizers,
      publishedEvents,
      totalEvents,
      platformRevenue: totalRevenue,
      feesCollected: platformFee,
      pendingApprovals,
      pendingSettlements,
    };

    const recentSales = [
      { name: 'Minggu 1', sales: 120, revenue: Math.round(totalRevenue * 0.15) },
      { name: 'Minggu 2', sales: 250, revenue: Math.round(totalRevenue * 0.25) },
      { name: 'Minggu 3', sales: 380, revenue: Math.round(totalRevenue * 0.35) },
      { name: 'Minggu 4', sales: 480, revenue: Math.round(totalRevenue * 0.25) },
    ];

    return {
      metrics,
      recentSales,
      totalOrganizers,
      activeOrganizers,
      totalEvents,
      publishedEvents,
      totalRevenue,
      platformFee,
    };
  }

  /**
   * Detail organizer beserta list event miliknya
   */
  async getOrganizerById(id: string) {
    const o = await this.prisma.organizer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        events: {
          include: {
            ticketCategories: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!o) throw new NotFoundException('Organizer tidak ditemukan');

    return {
      id: o.id,
      name: o.name,
      slug: o.slug,
      email: o.user.email,
      phone: o.phone || '08123456789',
      status: o.status || 'pending',
      plan: o.plan,
      segment: o.segment,
      bankAccount: o.bankAccount,
      internetFee: o.internetFee ?? 0,
      createdAt: o.createdAt.toISOString(),
      approvedAt: o.approvedAt ? o.approvedAt.toISOString() : null,
      approvedBy: o.approvedBy || null,
      events: o.events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status.toLowerCase(),
        location: e.location,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        ticketsSold: e.ticketCategories.reduce((s, tc) => s + tc.sold, 0),
        quota: e.ticketCategories.reduce((s, tc) => s + tc.quota, 0),
      })),
    };
  }

  /**
   * Menyetujui organizer baru (pending -> active)
   */
  async approveOrganizer(id: string, adminId?: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { id } });
    if (!organizer) throw new NotFoundException('Organizer tidak ditemukan');

    const updated = await this.prisma.organizer.update({
      where: { id },
      data: {
        status: 'active',
        approvedAt: new Date(),
        approvedBy: adminId || 'admin',
      },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'approve_organizer',
      id,
      'organizer',
      { organizerName: organizer.name, previousStatus: organizer.status },
    );

    return updated;
  }

  /**
   * Menangguhkan akun organizer (suspend)
   */
  async suspendOrganizer(id: string, adminId?: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { id } });
    if (!organizer) throw new NotFoundException('Organizer tidak ditemukan');

    const updated = await this.prisma.organizer.update({
      where: { id },
      data: {
        status: 'suspended',
      },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'suspend_organizer',
      id,
      'organizer',
      { organizerName: organizer.name, previousStatus: organizer.status },
    );

    return updated;
  }

  /**
   * Memperbarui paket langganan (plan) organizer
   */
  async updatePlan(id: string, plan: string, adminId?: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { id } });
    if (!organizer) throw new NotFoundException('Organizer tidak ditemukan');

    const updated = await this.prisma.organizer.update({
      where: { id },
      data: {
        plan,
        planStartedAt: new Date(),
      },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'change_plan',
      id,
      'organizer',
      { previousPlan: organizer.plan, newPlan: plan },
    );

    return updated;
  }

  /**
   * Force unpublish event bermasalah
   */
  async forceUnpublishEvent(id: string, adminId?: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event tidak ditemukan');

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'force_unpublish',
      id,
      'event',
      { eventTitle: event.title, previousStatus: event.status },
    );

    return updated;
  }

  /**
   * Pencarian pesanan lintas organizer
   */
  async searchOrders(query?: string) {
    const where: any = {};
    if (query) {
      where.OR = [
        { id: { contains: query, mode: 'insensitive' } },
        { buyer: { email: { contains: query, mode: 'insensitive' } } },
        {
          orderItems: {
            some: { attendeeName: { contains: query, mode: 'insensitive' } },
          },
        },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        buyer: { select: { email: true } },
        event: {
          select: {
            id: true,
            title: true,
            organizer: { select: { name: true } },
          },
        },
        orderItems: { include: { ticketCategory: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((o) => {
      const firstItem = o.orderItems[0];
      return {
        id: o.id,
        eventId: o.eventId,
        eventTitle: o.event?.title || 'Event',
        organizerName: o.event?.organizer?.name || 'Organizer',
        buyerName: firstItem?.attendeeName || 'Pembeli',
        buyerEmail: o.buyer?.email || firstItem?.attendeeEmail || '-',
        buyerPhone: firstItem?.attendeePhone || '-',
        status: o.status.toLowerCase(),
        totalAmount: Number(o.totalAmount) || 0,
        discountAmount: Number(o.discountAmount) || 0,
        promoCode: o.promoCodeId,
        createdAt: o.createdAt.toISOString(),
        expiredAt: o.expiredAt ? o.expiredAt.toISOString() : null,
        items: o.orderItems.map((it) => ({
          id: it.id,
          name: it.ticketCategory?.name || 'Tiket',
          categoryName: it.ticketCategory?.name || 'Tiket',
          qty: Number(it.qty) || 1,
          price: Number(it.unitPrice ?? it.ticketCategory?.price ?? 0),
          unitPrice: Number(it.unitPrice ?? it.ticketCategory?.price ?? 0),
          attendeeName: it.attendeeName,
          attendeePhone: it.attendeePhone,
        })),
      };
    });
  }

  /**
   * Menghitung dan membuat record settlement otomatis untuk event yang telah selesai
   */
  async calculateSettlements() {
    return this.settlementsService.calculatePendingSettlements();
  }

  /**
   * Mendapatkan daftar settlement yang perlu diproses
   */
  async getSettlements() {
    return this.settlementsService.getSettlements();
  }

  /**
   * Menandai settlement sudah ditransfer ke rekening organizer
   */
  async markSettlementPaid(id: string, adminId?: string) {
    return this.settlementsService.markSettlementPaid(id, adminId || 'admin');
  }

  /**
   * Mengambil log audit aktivitas admin
   */
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  /**
   * Mengatur Internet Fee pada Event dan seluruh/sebagian Kategori Tiket
   */
  async updateEventInternetFee(
    eventId: string,
    dto: UpdateEventFeeDto,
    adminId?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: true },
    });
    if (!event) throw new NotFoundException('Event tidak ditemukan');

    await this.prisma.$transaction(async (tx) => {
      // 1. Update event default internet fee
      await tx.event.update({
        where: { id: eventId },
        data: { internetFee: dto.internetFee },
      });

      // 2. Jika applyToAllCategories = true, set semua ticketCategories ke nominal event fee
      if (dto.applyToAllCategories) {
        await tx.ticketCategory.updateMany({
          where: { eventId },
          data: { internetFee: dto.internetFee },
        });
      } else if (dto.categories && dto.categories.length > 0) {
        // 3. Update nominal kustom per kategori yang dikirim
        for (const cat of dto.categories) {
          await tx.ticketCategory.update({
            where: { id: cat.id },
            data: { internetFee: cat.internetFee },
          });
        }
      }
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'update_event_internet_fee',
      eventId,
      'event',
      {
        internetFee: dto.internetFee,
        applyToAllCategories: dto.applyToAllCategories,
        categoriesCount: dto.categories?.length || 0,
      },
    );

    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: true },
    });
  }

  /**
   * Mengaktifkan atau menonaktifkan izin resell/transfer tiket per event (Main Admin)
   */
  async toggleEventTransfer(
    eventId: string,
    allowTicketTransfer: boolean,
    adminId?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event tidak ditemukan');

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { allowTicketTransfer },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'toggle_event_transfer',
      eventId,
      'event',
      { allowTicketTransfer },
    );

    return updated;
  }

  /**
   * Pencatatan log audit internal
   */
  async recordAuditLog(
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    details?: any,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          adminId,
          action,
          targetId,
          targetType,
          details: details || null,
        },
      });
    } catch (err) {
      console.error('Gagal mencatat audit log:', err);
    }
  }

  /**
   * Sinkronisasi status order langsung ke payment gateway (DOKU)
   */
  async syncOrderPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const invoiceNumber = `TAQTIX-ORD-${order.id}`;
    const result = await this.paymentsService.checkDokuOrderStatus(invoiceNumber);

    const refreshed = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    return {
      orderId,
      status: refreshed?.status.toLowerCase(),
      paymentStatus: refreshed?.payment?.status.toLowerCase(),
      gatewayResult: result,
    };
  }

  /**
   * Menandai order sebagai LUNAS secara manual oleh Superadmin
   */
  async markOrderPaid(orderId: string, adminId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (order.status === 'PAID') {
      return { success: true, message: 'Pesanan sudah berstatus LUNAS' };
    }

    await this.paymentsService.processPaymentSuccess(
      order.id,
      `MANUAL_ADMIN_${adminId || 'SUPERADMIN'}_${Date.now()}`,
      new Date(),
    );

    await this.recordAuditLog(
      adminId || 'admin',
      'manual_mark_order_paid',
      orderId,
      'order',
      { orderId, previousStatus: order.status },
    );

    return {
      success: true,
      message: 'Pesanan berhasil diverifikasi dan ditandai LUNAS secara manual',
    };
  }
}
