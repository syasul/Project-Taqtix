import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import * as crypto from 'crypto';

@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganizerAndVerifyOwner(userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
      include: { organizer: true },
    });

    if (member) {
      if (member.role !== 'owner') {
        throw new ForbiddenException('Hanya peran Owner yang berhak mengelola API token.');
      }
      return member.organizer;
    }

    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });

    if (!organizer) {
      throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
    }

    return organizer;
  }

  /**
   * Generate token API baru. Mengembalikan token asli satu kali saja.
   */
  async generateToken(dto: CreateApiTokenDto, userId: string) {
    const organizer = await this.getOrganizerAndVerifyOwner(userId);

    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullToken = `taq_live_${rawSecret}`;
    const tokenHash = crypto.createHash('sha256').update(fullToken).digest('hex');
    const tokenPreview = `...${fullToken.slice(-8)}`;

    const scopes = dto.scopes && dto.scopes.length > 0
      ? dto.scopes
      : ['read:events', 'read:orders', 'read:attendance'];

    const record = await this.prisma.apiToken.create({
      data: {
        organizerId: organizer.id,
        name: dto.name,
        tokenHash,
        tokenPreview,
        scopes,
        createdBy: userId,
      },
    });

    return {
      id: record.id,
      name: record.name,
      token: fullToken, // Ditampilkan HANYA SEKALI
      tokenPreview: record.tokenPreview,
      scopes: record.scopes,
      createdAt: record.createdAt,
    };
  }

  /**
   * Mendapatkan daftar token API milik organizer (tanpa secret asli).
   */
  async listTokens(userId: string) {
    const organizer = await this.getOrganizerAndVerifyOwner(userId);

    return this.prisma.apiToken.findMany({
      where: {
        organizerId: organizer.id,
      },
      select: {
        id: true,
        name: true,
        tokenPreview: true,
        scopes: true,
        lastUsedAt: true,
        createdBy: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Menolak / mencabut akses token API.
   */
  async revokeToken(id: string, userId: string) {
    const organizer = await this.getOrganizerAndVerifyOwner(userId);

    const token = await this.prisma.apiToken.findUnique({
      where: { id },
    });

    if (!token || token.organizerId !== organizer.id) {
      throw new NotFoundException('API Token tidak ditemukan');
    }

    return this.prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Memvalidasi API token dari request header X-API-Key.
   */
  async validateApiKey(apiKey: string) {
    const tokenHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const tokenRecord = await this.prisma.apiToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        organizer: true,
      },
    });

    if (!tokenRecord) {
      return null;
    }

    // Update lastUsedAt secara asynchronous tanpa blocking
    this.prisma.apiToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return tokenRecord;
  }
}
