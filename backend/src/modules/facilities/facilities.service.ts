import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';

@Injectable()
export class FacilitiesService {
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

  async create(eventId: string, dto: CreateFacilityDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    return this.prisma.eventFacility.create({
      data: {
        eventId,
        name: dto.name,
        description: dto.description || null,
        price: dto.price ?? 0,
        quota: dto.quota || null,
        applicableTicketCategoryIds: dto.applicableTicketCategoryIds
          ? (dto.applicableTicketCategoryIds as any)
          : undefined,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.eventFacility.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    eventId: string,
    facilityId: string,
    dto: UpdateFacilityDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    const facility = await this.prisma.eventFacility.findUnique({
      where: { id: facilityId },
    });

    if (!facility || facility.eventId !== eventId) {
      throw new NotFoundException('Fasilitas event tidak ditemukan');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.quota !== undefined) data.quota = dto.quota;
    if (dto.applicableTicketCategoryIds !== undefined) {
      data.applicableTicketCategoryIds = dto.applicableTicketCategoryIds;
    }

    return this.prisma.eventFacility.update({
      where: { id: facilityId },
      data,
    });
  }

  async delete(eventId: string, facilityId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const facility = await this.prisma.eventFacility.findUnique({
      where: { id: facilityId },
    });

    if (!facility || facility.eventId !== eventId) {
      throw new NotFoundException('Fasilitas event tidak ditemukan');
    }

    return this.prisma.eventFacility.delete({
      where: { id: facilityId },
    });
  }
}
