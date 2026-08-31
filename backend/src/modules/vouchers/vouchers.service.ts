import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Membuat voucher baru untuk organisasi (bisa org-wide atau event-scoped).
   */
  async create(dto: CreateVoucherDto, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const existing = await this.prisma.voucher.findUnique({
      where: {
        organizerId_code: {
          organizerId: organizer.id,
          code: dto.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Kode voucher ini sudah digunakan di organisasi Anda');
    }

    return this.prisma.voucher.create({
      data: {
        organizerId: organizer.id,
        eventId: dto.eventId || null,
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        usageLimit: dto.usageLimit || null,
        maxDiscountAmount: dto.maxDiscountAmount || null,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        applicableEventIds: dto.applicableEventIds
          ? (dto.applicableEventIds as any)
          : undefined,
        status: 'active',
      },
    });
  }

  /**
   * Mendapatkan daftar semua voucher organisasi dengan filter opsional eventId.
   */
  async findAll(userId: string, eventId?: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const where: any = {
      organizerId: organizer.id,
    };

    if (eventId) {
      where.OR = [
        { eventId },
        { eventId: null },
      ];
    }

    return this.prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Mengupdate voucher.
   */
  async update(id: string, dto: UpdateVoucherDto, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher || voucher.organizerId !== organizer.id) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code.toUpperCase();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.maxDiscountAmount !== undefined) data.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.validFrom !== undefined) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);
    if (dto.applicableEventIds !== undefined) data.applicableEventIds = dto.applicableEventIds;
    if (dto.eventId !== undefined) data.eventId = dto.eventId;

    return this.prisma.voucher.update({
      where: { id },
      data,
    });
  }

  /**
   * Menonaktifkan voucher.
   */
  async deactivate(id: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher || voucher.organizerId !== organizer.id) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    return this.prisma.voucher.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  /**
   * Validasi voucher publik untuk proses checkout.
   */
  async validateVoucher(code: string, eventId: string, totalAmount: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    const voucher = await this.prisma.voucher.findFirst({
      where: {
        code: code.toUpperCase(),
        organizerId: event.organizerId,
      },
    });

    if (!voucher) {
      throw new BadRequestException('Kode voucher tidak valid');
    }

    if (voucher.status !== 'active') {
      throw new BadRequestException('Voucher sudah tidak aktif atau kedaluwarsa');
    }

    const now = new Date();
    if (now < voucher.validFrom || now > voucher.validUntil) {
      throw new BadRequestException('Voucher berada di luar periode masa berlaku');
    }

    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      throw new BadRequestException('Kuota penggunaan voucher sudah habis');
    }

    // Cek event scoping
    if (voucher.eventId && voucher.eventId !== eventId) {
      throw new BadRequestException('Voucher tidak berlaku untuk event ini');
    }

    if (
      voucher.applicableEventIds &&
      Array.isArray(voucher.applicableEventIds) &&
      voucher.applicableEventIds.length > 0 &&
      !voucher.applicableEventIds.includes(eventId)
    ) {
      throw new BadRequestException('Voucher tidak berlaku untuk event ini');
    }

    let discount = 0;
    if (voucher.type === 'percentage') {
      discount = (totalAmount * voucher.value) / 100;
      if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    } else {
      discount = voucher.value;
    }

    discount = Math.min(discount, totalAmount);

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      discountAmount: discount,
    };
  }
}
