import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  GoneException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';

@Injectable()
export class AffiliatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

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
  }

  /**
   * Mendaftarkan partner afiliasi baru untuk event tertentu.
   */
  async create(
    eventId: string,
    dto: CreateAffiliateDto,
    organizerUserId: string,
  ) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    // Generate uniqueCode
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    const cleanName = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueCode = `${cleanName}-${randomSuffix}`;

    // Cek duplikasi email jika ada
    if (dto.email) {
      const existingPartner = await this.prisma.partner.findUnique({
        where: { email: dto.email },
      });
      if (existingPartner) {
        throw new ConflictException('Email partner sudah terdaftar');
      }
    }

    return this.prisma.partner.create({
      data: {
        eventId,
        name: dto.name,
        type: dto.type,
        uniqueCode,
        promoCode: dto.promoCode || null,
        commissionType: 'percentage',
        commissionValue: dto.commissionPct ?? 10,
        email: dto.email || null,
      },
    });
  }

  /**
   * Mencatat data klik tautan afiliasi dan mendapatkan URL redirect landing page.
   */
  async registerClickAndGetUrl(
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { uniqueCode: code },
      include: { event: true },
    });

    if (!partner) {
      throw new NotFoundException('Partner afiliasi tidak ditemukan');
    }

    // Naikkan counter klik & catat log Klik secara transaksional
    await this.prisma.$transaction(async (tx) => {
      await tx.partner.update({
        where: { id: partner.id },
        data: {
          clicks: { increment: 1 },
        },
      });

      const ipHash = crypto
        .createHash('sha256')
        .update(ipAddress || 'unknown')
        .digest('hex');

      await tx.click.create({
        data: {
          partnerId: partner.id,
          ipHash,
        },
      });
    });

    // Buat redirect URL ke FE landing page event dengan query param aff
    const frontendUrl =
      this.configService.get<string>('TAQTIX_FRONTEND_URL') ||
      'http://localhost:3000';
    return `${frontendUrl}/events/${partner.event.slug}?aff=${code}`;
  }

  /**
   * Mendapatkan daftar partner afiliasi terdaftar untuk event tertentu.
   */
  async findAll(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    return this.prisma.partner.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mendapatkan leaderboard performa penjualan partner afiliasi.
   */
  async getLeaderboard(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    return this.prisma.partner.findMany({
      where: { eventId },
      orderBy: [{ conversions: 'desc' }, { commissionEarned: 'desc' }],
    });
  }

  // --- PARTNER PORTAL AUTHENTICATION & METRICS ---

  /**
   * Meminta tautan masuk cepat (magic link) untuk partner.
   */
  async requestMagicLink(email: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { email },
    });
    if (!partner) {
      throw new NotFoundException('EMAIL_NOT_REGISTERED');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Hapus token lama jika ada
    await this.prisma.partnerMagicLink.deleteMany({
      where: { email },
    });

    await this.prisma.partnerMagicLink.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Simulasi pengiriman magic link
    console.log(`[PARTNER PORTAL MAGIC LINK]: http://localhost:3000/partner/verify?token=${token}`);

    return { success: true, token };
  }

  /**
   * Memverifikasi token magic link dan mengeluarkan JWT token.
   */
  async verifyMagicLink(token: string) {
    const magicLink = await this.prisma.partnerMagicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      throw new NotFoundException('Token magic link tidak valid');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new GoneException('Token magic link kedaluwarsa');
    }

    const partner = await this.prisma.partner.findUnique({
      where: { email: magicLink.email },
    });

    if (!partner) {
      throw new NotFoundException('Akun partner tidak ditemukan');
    }

    // Perbarui waktu login terakhir
    await this.prisma.partner.update({
      where: { id: partner.id },
      data: { lastLoginAt: new Date() },
    });

    // Bersihkan token
    await this.prisma.partnerMagicLink.delete({
      where: { id: magicLink.id },
    });

    return this.authService.generateTokenPair(partner.id, partner.email || '', 'partner');
  }

  /**
   * Mendapatkan dashboard data performa milik partner login.
   */
  async getPartnerStats(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
            startDate: true,
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner tidak ditemukan');
    }

    // Ambil riwayat order sukses terbaru
    const recentOrders = await this.prisma.order.findMany({
      where: {
        partnerId,
        status: 'PAID',
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const recentSales = recentOrders.map((o) => ({
      orderId: o.id,
      amount: o.totalAmount,
      date: o.createdAt,
    }));

    return {
      partnerId: partner.id,
      name: partner.name,
      uniqueCode: partner.uniqueCode,
      eventName: partner.event.title,
      eventSlug: partner.event.slug,
      clicks: partner.clicks,
      conversions: partner.conversions,
      revenueGenerated: partner.revenueGenerated,
      commissionEarned: partner.commissionEarned,
      commissionPct: partner.commissionValue,
      recentSales,
    };
  }
}
