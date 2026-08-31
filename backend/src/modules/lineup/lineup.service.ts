import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';
import { ReorderLineupDto } from './dto/reorder-lineup.dto';

@Injectable()
export class LineupService {
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
      throw new NotFoundException('Event tidak ditemukan atau bukan milik Anda');
    }
    return { event, organizer };
  }

  async create(eventId: string, dto: CreateLineupDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    let orderIndex = dto.order;
    if (orderIndex === undefined) {
      const count = await this.prisma.lineUpItem.count({ where: { eventId } });
      orderIndex = count;
    }

    return this.prisma.lineUpItem.create({
      data: {
        eventId,
        name: dto.name,
        photoUrl: dto.photoUrl || null,
        performTime: dto.performTime || null,
        stage: dto.stage || null,
        order: orderIndex,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.lineUpItem.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });
  }

  async update(
    eventId: string,
    itemId: string,
    dto: UpdateLineupDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    const item = await this.prisma.lineUpItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.eventId !== eventId) {
      throw new NotFoundException('Item lineup tidak ditemukan');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl;
    if (dto.performTime !== undefined) data.performTime = dto.performTime;
    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.order !== undefined) data.order = dto.order;

    return this.prisma.lineUpItem.update({
      where: { id: itemId },
      data,
    });
  }

  async delete(eventId: string, itemId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const item = await this.prisma.lineUpItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.eventId !== eventId) {
      throw new NotFoundException('Item lineup tidak ditemukan');
    }

    return this.prisma.lineUpItem.delete({
      where: { id: itemId },
    });
  }

  async reorder(eventId: string, dto: ReorderLineupDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.lineUpItem.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { success: true, message: 'Urutan lineup berhasil diperbarui' };
  }
}
