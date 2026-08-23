import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengubah segment dan plan dari organizer.
   */
  async updateOrganizerSegmentAndPlan(
    organizerId: string,
    dto: { segment?: string; plan?: string; planExpiresAt?: string },
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
        segment: dto.segment ?? organizer.segment,
        plan: dto.plan ?? organizer.plan,
        planStartedAt: dto.plan ? new Date() : organizer.planStartedAt,
        planExpiresAt: dto.planExpiresAt ? new Date(dto.planExpiresAt) : organizer.planExpiresAt,
      },
    });
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
}
