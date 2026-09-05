import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const organizer = await this.prisma.organizer.create({
      data: {
        userId: user.id,
        name: dto.name,
        slug,
        segment: dto.segment || 'event_builder',
        plan: dto.plan || 'starter',
        bankAccount: dto.bankAccount || '',
      },
    });

    return {
      id: organizer.id,
      name: organizer.name,
      email: user.email,
      slug: organizer.slug,
      plan: organizer.plan,
      segment: organizer.segment,
      bankAccount: organizer.bankAccount,
      status: 'active',
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

    await this.prisma.user.delete({
      where: { id: org.userId },
    }).catch(() => {});

    return { id, message: 'Organizer berhasil dihapus' };
  }

  /**
   * Mengubah segment dan plan dari organizer.
   */
  async updateOrganizerSegmentAndPlan(
    organizerId: string,
    dto: { segment?: string; plan?: string; planExpiresAt?: string; name?: string; bankAccount?: string },
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
        name: dto.name ?? organizer.name,
        segment: dto.segment ?? organizer.segment,
        plan: dto.plan ?? organizer.plan,
        bankAccount: dto.bankAccount ?? organizer.bankAccount,
        planStartedAt: dto.plan ? new Date() : organizer.planStartedAt,
        planExpiresAt: dto.planExpiresAt ? new Date(dto.planExpiresAt) : organizer.planExpiresAt,
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
        uniqueCode: dto.uniqueCode ? dto.uniqueCode.toUpperCase() : partner.uniqueCode,
        promoCode: dto.promoCode !== undefined ? dto.promoCode?.toUpperCase() : partner.promoCode,
        commissionType: dto.commissionType ?? partner.commissionType,
        commissionValue: dto.commissionValue ?? partner.commissionValue,
        email: dto.email ?? partner.email,
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
    }));
  }

  /**
   * Menyetujui event untuk tayang di platform
   */
  async approveEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
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
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
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
    const [totalOrganizers, activeOrganizers, totalEvents, publishedEvents, paidOrders] =
      await Promise.all([
        this.prisma.organizer.count(),
        this.prisma.organizer.count({ where: { status: 'active' } }),
        this.prisma.event.count(),
        this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.order.findMany({
          where: { status: 'PAID' },
          select: { totalAmount: true },
        }),
      ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformFee = Math.round(totalRevenue * 0.05); // 5% platform fee standar

    return {
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
        { orderItems: { some: { attendeeName: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        buyer: { select: { email: true } },
        event: { select: { id: true, title: true, organizer: { select: { name: true } } } },
        orderItems: { include: { ticketCategory: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((o) => ({
      id: o.id,
      eventId: o.eventId,
      eventTitle: o.event.title,
      organizerName: o.event.organizer.name,
      buyerEmail: o.buyer.email,
      status: o.status.toLowerCase(),
      totalAmount: o.totalAmount,
      promoCode: o.promoCodeId,
      createdAt: o.createdAt.toISOString(),
      items: o.orderItems.map((it) => ({
        categoryName: it.ticketCategory.name,
        qty: it.qty,
        attendeeName: it.attendeeName,
        attendeePhone: it.attendeePhone,
      })),
    }));
  }

  /**
   * Mendapatkan daftar settlement yang perlu diproses
   */
  async getSettlements() {
    return this.prisma.settlement.findMany({
      include: {
        organizer: { select: { id: true, name: true, bankAccount: true } },
        event: { select: { id: true, title: true, endDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Menandai settlement sudah ditransfer ke rekening organizer
   */
  async markSettlementPaid(id: string, adminId?: string) {
    const settlement = await this.prisma.settlement.findUnique({ where: { id } });
    if (!settlement) throw new NotFoundException('Settlement tidak ditemukan');

    const updated = await this.prisma.settlement.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidBy: adminId || 'admin',
      },
    });

    await this.recordAuditLog(
      adminId || 'admin',
      'mark_settlement_paid',
      id,
      'settlement',
      { netAmount: settlement.netAmount, eventId: settlement.eventId },
    );

    return updated;
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
}

