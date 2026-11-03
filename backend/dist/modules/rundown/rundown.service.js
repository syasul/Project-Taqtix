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
exports.RundownService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RundownService = class RundownService {
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
    async findAll(eventId) {
        return this.prisma.rundownItem.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
        });
    }
    async update(eventId, itemId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const existing = await this.prisma.rundownItem.findFirst({
            where: { id: itemId, eventId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Agenda rundown tidak ditemukan');
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
    async delete(eventId, itemId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const existing = await this.prisma.rundownItem.findFirst({
            where: { id: itemId, eventId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Agenda rundown tidak ditemukan');
        }
        await this.prisma.rundownItem.delete({
            where: { id: itemId },
        });
        return { success: true, message: 'Agenda rundown berhasil dihapus' };
    }
    async reorder(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const updates = dto.items.map((item) => this.prisma.rundownItem.updateMany({
            where: { id: item.id, eventId },
            data: { order: item.order },
        }));
        await this.prisma.$transaction(updates);
        return this.findAll(eventId);
    }
};
exports.RundownService = RundownService;
exports.RundownService = RundownService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RundownService);
//# sourceMappingURL=rundown.service.js.map