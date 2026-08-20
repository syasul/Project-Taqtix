import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import * as crypto from 'crypto';

@Injectable()
export class AffiliatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

    return this.prisma.partner.create({
      data: {
        eventId,
        name: dto.name,
        type: dto.type,
        uniqueCode,
        promoCode: dto.promoCode || null,
        commissionType: 'percentage',
        commissionValue: dto.commissionPct ?? 10,
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
}
