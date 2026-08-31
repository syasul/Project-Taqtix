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
exports.CustomFieldsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomFieldsService = class CustomFieldsService {
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
            const count = await this.prisma.customFormField.count({ where: { eventId } });
            orderIndex = count;
        }
        return this.prisma.customFormField.create({
            data: {
                eventId,
                label: dto.label,
                fieldType: dto.fieldType,
                options: dto.options ? dto.options : undefined,
                required: dto.required ?? false,
                order: orderIndex,
            },
        });
    }
    async findAll(eventId) {
        return this.prisma.customFormField.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
        });
    }
    async update(eventId, fieldId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const field = await this.prisma.customFormField.findUnique({
            where: { id: fieldId },
        });
        if (!field || field.eventId !== eventId) {
            throw new common_1.NotFoundException('Field formulir tidak ditemukan');
        }
        const data = {};
        if (dto.label !== undefined)
            data.label = dto.label;
        if (dto.fieldType !== undefined)
            data.fieldType = dto.fieldType;
        if (dto.options !== undefined)
            data.options = dto.options;
        if (dto.required !== undefined)
            data.required = dto.required;
        if (dto.order !== undefined)
            data.order = dto.order;
        return this.prisma.customFormField.update({
            where: { id: fieldId },
            data,
        });
    }
    async delete(eventId, fieldId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const field = await this.prisma.customFormField.findUnique({
            where: { id: fieldId },
        });
        if (!field || field.eventId !== eventId) {
            throw new common_1.NotFoundException('Field formulir tidak ditemukan');
        }
        return this.prisma.customFormField.delete({
            where: { id: fieldId },
        });
    }
    async reorder(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        await this.prisma.$transaction(dto.orderedIds.map((id, index) => this.prisma.customFormField.update({
            where: { id },
            data: { order: index },
        })));
        return { success: true, message: 'Urutan formulir berhasil diperbarui' };
    }
};
exports.CustomFieldsService = CustomFieldsService;
exports.CustomFieldsService = CustomFieldsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomFieldsService);
//# sourceMappingURL=custom-fields.service.js.map