import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRundownDto } from './dto/create-rundown.dto';
import { UpdateRundownDto } from './dto/update-rundown.dto';
import { ReorderRundownDto } from './dto/reorder-rundown.dto';

@Injectable()
export class RundownService {
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

  private async verifyEventOwnership(eventId: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.organizerId !== organizer.id) {
      throw new NotFoundException(
        'Event tidak ditemukan atau bukan milik Anda',
      );
    }
    return { event, organizer };
  }

  async create(eventId: string, dto: CreateRundownDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    let orderIndex = dto.order;
    if (orderIndex === undefined) {
      const count = await this.prisma.rundownItem.count({ where: { eventId } });
      orderIndex = count;
    }

    return this.prisma.rundownItem.create({
      data: {
        eventId,
        timeRange: dto.timeRange.trim(),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        isHighlight: dto.isHighlight ?? false,
        order: orderIndex,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.rundownItem.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });
  }

  async update(
    eventId: string,
    itemId: string,
    dto: UpdateRundownDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    const existing = await this.prisma.rundownItem.findFirst({
      where: { id: itemId, eventId },
    });
    if (!existing) {
      throw new NotFoundException('Agenda rundown tidak ditemukan');
    }

    return this.prisma.rundownItem.update({
      where: { id: itemId },
      data: {
        ...(dto.timeRange !== undefined ? { timeRange: dto.timeRange.trim() } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.isHighlight !== undefined ? { isHighlight: dto.isHighlight } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async delete(eventId: string, itemId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const existing = await this.prisma.rundownItem.findFirst({
      where: { id: itemId, eventId },
    });
    if (!existing) {
      throw new NotFoundException('Agenda rundown tidak ditemukan');
    }

    await this.prisma.rundownItem.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Agenda rundown berhasil dihapus' };
  }

  async reorder(eventId: string, dto: ReorderRundownDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const updates = dto.items.map((item) =>
      this.prisma.rundownItem.updateMany({
        where: { id: item.id, eventId },
        data: { order: item.order },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll(eventId);
  }
}
