import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  // --- ORGANIZATION ---
  async getOrganization(userId: string) {
    const organizerId = await this.getOrganizerId(userId);
    const org = await this.prisma.organizer.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        contactEmail: true,
        phone: true,
      },
    });
    if (!org) throw new NotFoundException('Organizer tidak ditemukan');
    return org;
  }

  async updateOrganization(
    userId: string,
    data: { name?: string; logoUrl?: string; contactEmail?: string; phone?: string },
  ) {
    const organizerId = await this.getOrganizerId(userId);
    const updated = await this.prisma.organizer.update({
      where: { id: organizerId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        contactEmail: true,
        phone: true,
      },
    });
    return updated;
  }

  // --- PAYMENT ---
  async getPayment(userId: string) {
    const organizerId = await this.getOrganizerId(userId);
    const org = await this.prisma.organizer.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
      },
    });
    if (!org) throw new NotFoundException('Organizer tidak ditemukan');
    return {
      bankName: org.bankName || '',
      bankAccountNumber: org.bankAccountNumber || '',
      bankAccountHolder: org.bankAccountHolder || '',
    };
  }

  async updatePayment(
    userId: string,
    data: { bankName?: string; bankAccountNumber?: string; bankAccountHolder?: string },
  ) {
    const organizerId = await this.getOrganizerId(userId);
    const updated = await this.prisma.organizer.update({
      where: { id: organizerId },
      data: {
        ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
        ...(data.bankAccountNumber !== undefined ? { bankAccountNumber: data.bankAccountNumber } : {}),
        ...(data.bankAccountHolder !== undefined ? { bankAccountHolder: data.bankAccountHolder } : {}),
      },
      select: {
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
      },
    });
    return updated;
  }

  // --- INTEGRATIONS ---
  async getIntegrations(userId: string) {
    const organizerId = await this.getOrganizerId(userId);
    const org = await this.prisma.organizer.findUnique({
      where: { id: organizerId },
      select: {
        integrations: true,
      },
    });
    if (!org) throw new NotFoundException('Organizer tidak ditemukan');
    const integrations = (org.integrations as any) || {};
    return {
      metaPixelId: integrations.metaPixelId || '',
      tiktokPixelId: integrations.tiktokPixelId || '',
      gaTrackingId: integrations.gaTrackingId || '',
    };
  }

  async updateIntegrations(
    userId: string,
    data: { metaPixelId?: string; tiktokPixelId?: string; gaTrackingId?: string },
  ) {
    const organizerId = await this.getOrganizerId(userId);
    const updated = await this.prisma.organizer.update({
      where: { id: organizerId },
      data: {
        integrations: {
          metaPixelId: data.metaPixelId || '',
          tiktokPixelId: data.tiktokPixelId || '',
          gaTrackingId: data.gaTrackingId || '',
        },
      },
      select: {
        integrations: true,
      },
    });
    return updated.integrations;
  }
}
