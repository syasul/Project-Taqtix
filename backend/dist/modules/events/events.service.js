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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerOrThrow(userId) {
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
            throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
        }
        return organizer;
    }
    async create(dto, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        let slug = dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
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
                status: client_1.EventStatus.DRAFT,
            },
        });
    }
    async update(id, dto, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const event = await this.prisma.event.findUnique({
            where: { id },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
        const updateData = {};
        if (dto.title !== undefined) {
            updateData.title = dto.title;
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
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.bannerUrl !== undefined)
            updateData.bannerUrl = dto.bannerUrl;
        if (dto.location !== undefined)
            updateData.location = dto.location;
        if (dto.startDate !== undefined)
            updateData.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            updateData.endDate = new Date(dto.endDate);
        return this.prisma.event.update({
            where: { id },
            data: updateData,
        });
    }
    async publish(id, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const event = await this.prisma.event.findUnique({
            where: { id },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
        return this.prisma.event.update({
            where: { id },
            data: {
                status: client_1.EventStatus.PUBLISHED,
            },
        });
    }
    async findAllPublic() {
        return this.prisma.event.findMany({
            where: {
                status: client_1.EventStatus.PUBLISHED,
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
    async findOnePublicBySlug(slug) {
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
        if (!event || event.status !== client_1.EventStatus.PUBLISHED) {
            throw new common_1.NotFoundException('Event tidak ditemukan atau belum dipublikasikan');
        }
        return event;
    }
    async findAllOrganizerEvents(userId) {
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
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map