import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper untuk mencari profil Organizer berdasarkan User ID.
   */
  private async getOrganizerOrThrow(userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        organizer: true,
      },
    });
    if (member?.organizer) {
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
   * Membuat event baru dengan status default DRAFT.
   */
  async create(dto: CreateEventDto, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    // Generate slug dari title
    let slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Cek duplikasi slug
    const existingEvent = await this.prisma.event.findUnique({
      where: { slug },
    });
    if (existingEvent) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    return this.prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: dto.title,
        slug,
        description: dto.description,
        bannerUrl: dto.bannerUrl || '',
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: EventStatus.DRAFT,
      },
    });
  }

  /**
   * Mengubah data event oleh organizer yang memilikinya.
   */
  async update(id: string, dto: UpdateEventDto, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizer.id) {
      throw new ForbiddenException(
        'Akses ditolak: Anda bukan pemilik event ini',
      );
    }

    const updateData: any = {};
    if (dto.title !== undefined) {
      updateData.title = dto.title;
      // Opsional: perbarui slug jika judul berubah
      let slug = dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const existingEvent = await this.prisma.event.findUnique({
        where: { slug },
      });
      if (existingEvent && existingEvent.id !== id) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      }
      updateData.slug = slug;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.bannerUrl !== undefined) updateData.bannerUrl = dto.bannerUrl;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.startDate !== undefined)
      updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Mempublikasikan event agar dapat dilihat publik.
   */
  async publish(id: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizer.id) {
      throw new ForbiddenException(
        'Akses ditolak: Anda bukan pemilik event ini',
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.PUBLISHED,
      },
    });
  }

  /**
   * Mendapatkan semua event yang sudah terpublikasi (public).
   */
  async findAllPublic() {
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
      },
      include: {
        organizer: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  /**
   * Mendapatkan detail event publik berdasarkan slug.
   */
  async findOnePublicBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            name: true,
            slug: true,
          },
        },
        ticketCategories: {
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException(
        'Event tidak ditemukan atau belum dipublikasikan',
      );
    }

    return event;
  }

  /**
   * Mendapatkan semua event milik organizer yang sedang login.
   */
  async findAllOrganizerEvents(userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);

    return this.prisma.event.findMany({
      where: {
        organizerId: organizer.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
