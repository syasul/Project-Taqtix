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
exports.FacilitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FacilitiesService = class FacilitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerOrThrow(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
            include: { organizer: true },
        });
        if (member?.organizer)
            return member.organizer;
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
        }
        return organizer;
    }
    async verifyEventOwnership(eventId, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event || event.organizerId !== organizer.id) {
            throw new common_1.NotFoundException('Event tidak ditemukan atau bukan milik Anda');
        }
        return { event, organizer };
    }
    async create(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.eventFacility.create({
            data: {
                eventId,
                name: dto.name,
                description: dto.description || null,
                price: dto.price ?? 0,
                quota: dto.quota || null,
                applicableTicketCategoryIds: dto.applicableTicketCategoryIds
                    ? dto.applicableTicketCategoryIds
                    : undefined,
            },
        });
    }
    async findAll(eventId) {
        return this.prisma.eventFacility.findMany({
            where: { eventId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async update(eventId, facilityId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const facility = await this.prisma.eventFacility.findUnique({
            where: { id: facilityId },
        });
        if (!facility || facility.eventId !== eventId) {
            throw new common_1.NotFoundException('Fasilitas event tidak ditemukan');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.price !== undefined)
            data.price = dto.price;
        if (dto.quota !== undefined)
            data.quota = dto.quota;
        if (dto.applicableTicketCategoryIds !== undefined) {
            data.applicableTicketCategoryIds = dto.applicableTicketCategoryIds;
        }
        return this.prisma.eventFacility.update({
            where: { id: facilityId },
            data,
        });
    }
    async delete(eventId, facilityId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const facility = await this.prisma.eventFacility.findUnique({
            where: { id: facilityId },
        });
        if (!facility || facility.eventId !== eventId) {
            throw new common_1.NotFoundException('Fasilitas event tidak ditemukan');
        }
        return this.prisma.eventFacility.delete({
            where: { id: facilityId },
        });
    }
};
exports.FacilitiesService = FacilitiesService;
exports.FacilitiesService = FacilitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FacilitiesService);
//# sourceMappingURL=facilities.service.js.map