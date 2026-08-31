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
exports.LineupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LineupService = class LineupService {
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
    async findAll(eventId) {
        return this.prisma.lineUpItem.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
        });
    }
    async update(eventId, itemId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const item = await this.prisma.lineUpItem.findUnique({
            where: { id: itemId },
        });
        if (!item || item.eventId !== eventId) {
            throw new common_1.NotFoundException('Item lineup tidak ditemukan');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.photoUrl !== undefined)
            data.photoUrl = dto.photoUrl;
        if (dto.performTime !== undefined)
            data.performTime = dto.performTime;
        if (dto.stage !== undefined)
            data.stage = dto.stage;
        if (dto.order !== undefined)
            data.order = dto.order;
        return this.prisma.lineUpItem.update({
            where: { id: itemId },
            data,
        });
    }
    async delete(eventId, itemId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const item = await this.prisma.lineUpItem.findUnique({
            where: { id: itemId },
        });
        if (!item || item.eventId !== eventId) {
            throw new common_1.NotFoundException('Item lineup tidak ditemukan');
        }
        return this.prisma.lineUpItem.delete({
            where: { id: itemId },
        });
    }
    async reorder(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        await this.prisma.$transaction(dto.orderedIds.map((id, index) => this.prisma.lineUpItem.update({
            where: { id },
            data: { order: index },
        })));
        return { success: true, message: 'Urutan lineup berhasil diperbarui' };
    }
};
exports.LineupService = LineupService;
exports.LineupService = LineupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LineupService);
//# sourceMappingURL=lineup.service.js.map