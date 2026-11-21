import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FollowOrganizerDto } from './dto/follow-organizer.dto';

@Injectable()
export class OrganizersService {
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

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  async getPublicOrganizer(slug: string) {
    const org = await this.prisma.organizer.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        bannerUrl: true,
        bio: true,
        contactEmail: true,
        phone: true,
        website: true,
        instagram: true,
        tiktok: true,
        youtube: true,
        createdAt: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Penyelenggara / Organizer tidak ditemukan');
    }

    const now = new Date();

    const [followerCount, allEvents, posts] = await Promise.all([
      this.prisma.organizerFollower.count({
        where: { organizerId: org.id },
      }),
      this.prisma.event.findMany({
        where: {
          organizerId: org.id,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          bannerUrl: true,
          location: true,
          startDate: true,
          endDate: true,
          ticketCategories: {
            select: {
              price: true,
            },
            orderBy: { price: 'asc' },
            take: 1,
          },
        },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.organizerPost.findMany({
        where: { organizerId: org.id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const upcomingEvents = allEvents
      .filter((e) => new Date(e.endDate) >= now)
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        bannerUrl: e.bannerUrl,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        lowestPrice: e.ticketCategories[0]?.price ?? 0,
      }));

    const pastEvents = allEvents
      .filter((e) => new Date(e.endDate) < now)
      .reverse()
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        bannerUrl: e.bannerUrl,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        lowestPrice: e.ticketCategories[0]?.price ?? 0,
      }));

    return {
      organizer: {
        ...org,
        followerCount,
        eventCount: allEvents.length,
      },
      upcomingEvents,
      pastEvents,
      posts,
      affiliateProgram: {
        active: true,
        title: `Program Afiliasi Resmi ${org.name}`,
        description:
          'Dapatkan komisi penjualan tiket dengan membagikan link unik acara resmi. Pantau performa klik, penjualan, dan penarikan komisi secara transparan.',
        portalUrl: '/partner/login',
      },
    };
  }

  async toggleFollow(slug: string, dto: FollowOrganizerDto, userId?: string) {
    const org = await this.prisma.organizer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organizer tidak ditemukan');
    }

    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.organizerFollower.findUnique({
      where: {
        organizerId_email: {
          organizerId: org.id,
          email,
        },
      },
    });

    let isFollowing = false;

    if (existing) {
      await this.prisma.organizerFollower.delete({
        where: { id: existing.id },
      });
      isFollowing = false;
    } else {
      await this.prisma.organizerFollower.create({
        data: {
          organizerId: org.id,
          email,
          name: dto.name?.trim() || null,
          userId: userId || null,
        },
      });
      isFollowing = true;
    }

    const followerCount = await this.prisma.organizerFollower.count({
      where: { organizerId: org.id },
    });

    return {
      isFollowing,
      followerCount,
      message: isFollowing
        ? 'Berhasil mengikuti organizer ini'
        : 'Berhenti mengikuti organizer ini',
    };
  }

  async checkFollowing(slug: string, email: string) {
    if (!email) return { isFollowing: false };

    const org = await this.prisma.organizer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) return { isFollowing: false };

    const existing = await this.prisma.organizerFollower.findUnique({
      where: {
        organizerId_email: {
          organizerId: org.id,
          email: email.toLowerCase().trim(),
        },
      },
    });

    return { isFollowing: !!existing };
  }

  async getPublicPosts(slug: string, page = 1, limit = 10) {
    const org = await this.prisma.organizer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organizer tidak ditemukan');
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.organizerPost.findMany({
        where: { organizerId: org.id },
        include: {
          event: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organizerPost.count({
        where: { organizerId: org.id },
      }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // EO PROTECTED ENDPOINTS
  // ==========================================

  async getOrganizerPosts(userId: string) {
    const organizerId = await this.getOrganizerId(userId);

    const posts = await this.prisma.organizerPost.findMany({
      where: { organizerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts;
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const organizerId = await this.getOrganizerId(userId);

    if (dto.eventId) {
      const event = await this.prisma.event.findFirst({
        where: { id: dto.eventId, organizerId },
      });
      if (!event) {
        throw new BadRequestException('Event terkait tidak ditemukan untuk organizer Anda');
      }
    }

    const post = await this.prisma.organizerPost.create({
      data: {
        organizerId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        eventId: dto.eventId || null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return post;
  }

  async deletePost(userId: string, postId: string) {
    const organizerId = await this.getOrganizerId(userId);

    const post = await this.prisma.organizerPost.findFirst({
      where: { id: postId, organizerId },
    });

    if (!post) {
      throw new NotFoundException('Kabar / post tidak ditemukan');
    }

    await this.prisma.organizerPost.delete({
      where: { id: postId },
    });

    return { success: true, message: 'Kabar berhasil dihapus' };
  }

  async getFollowers(
    userId: string,
    page = 1,
    limit = 50,
    search?: string,
  ) {
    const organizerId = await this.getOrganizerId(userId);
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = { organizerId };
    if (search && search.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [followers, total] = await Promise.all([
      this.prisma.organizerFollower.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organizerFollower.count({ where }),
    ]);

    return {
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
