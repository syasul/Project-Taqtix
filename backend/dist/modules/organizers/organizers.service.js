"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizersService = class OrganizersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerId(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
        });
        if (member)
            return member.organizerId;
        const org = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!org) {
            throw new common_1.ForbiddenException('Profil organizer tidak ditemukan');
        }
        return org.id;
    }
    async getPublicOrganizer(slug) {
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
            throw new common_1.NotFoundException('Penyelenggara / Organizer tidak ditemukan');
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
                description: 'Dapatkan komisi penjualan tiket dengan membagikan link unik acara resmi. Pantau performa klik, penjualan, dan penarikan komisi secara transparan.',
                portalUrl: '/partner/login',
            },
        };
    }
    async toggleFollow(slug, dto, userId) {
        const org = await this.prisma.organizer.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
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
        }
        else {
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
    async checkFollowing(slug, email) {
        if (!email)
            return { isFollowing: false };
        const org = await this.prisma.organizer.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!org)
            return { isFollowing: false };
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
    async getPublicPosts(slug, page = 1, limit = 10) {
        const org = await this.prisma.organizer.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
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
    async getOrganizerPosts(userId) {
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
    async createPost(userId, dto) {
        const organizerId = await this.getOrganizerId(userId);
        if (dto.eventId) {
            const event = await this.prisma.event.findFirst({
                where: { id: dto.eventId, organizerId },
            });
            if (!event) {
                throw new common_1.BadRequestException('Event terkait tidak ditemukan untuk organizer Anda');
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
    async deletePost(userId, postId) {
        const organizerId = await this.getOrganizerId(userId);
        const post = await this.prisma.organizerPost.findFirst({
            where: { id: postId, organizerId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Kabar / post tidak ditemukan');
        }
        await this.prisma.organizerPost.delete({
            where: { id: postId },
        });
        return { success: true, message: 'Kabar berhasil dihapus' };
    }
    async getFollowers(userId, page = 1, limit = 50, search) {
        const organizerId = await this.getOrganizerId(userId);
        const skip = (Math.max(1, page) - 1) * limit;
        const where = { organizerId };
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
};
exports.OrganizersService = OrganizersService;
exports.OrganizersService = OrganizersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizersService);
//# sourceMappingURL=organizers.service.js.map