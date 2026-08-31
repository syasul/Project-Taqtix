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
exports.VouchersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VouchersService = class VouchersService {
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
    async create(dto, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const existing = await this.prisma.voucher.findUnique({
            where: {
                organizerId_code: {
                    organizerId: organizer.id,
                    code: dto.code.toUpperCase(),
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Kode voucher ini sudah digunakan di organisasi Anda');
        }
        return this.prisma.voucher.create({
            data: {
                organizerId: organizer.id,
                eventId: dto.eventId || null,
                code: dto.code.toUpperCase(),
                type: dto.type,
                value: dto.value,
                usageLimit: dto.usageLimit || null,
                maxDiscountAmount: dto.maxDiscountAmount || null,
                validFrom: new Date(dto.validFrom),
                validUntil: new Date(dto.validUntil),
                applicableEventIds: dto.applicableEventIds
                    ? dto.applicableEventIds
                    : undefined,
                status: 'active',
            },
        });
    }
    async findAll(userId, eventId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const where = {
            organizerId: organizer.id,
        };
        if (eventId) {
            where.OR = [
                { eventId },
                { eventId: null },
            ];
        }
        return this.prisma.voucher.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    select: { id: true, title: true },
                },
            },
        });
    }
    async update(id, dto, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const voucher = await this.prisma.voucher.findUnique({
            where: { id },
        });
        if (!voucher || voucher.organizerId !== organizer.id) {
            throw new common_1.NotFoundException('Voucher tidak ditemukan');
        }
        const data = {};
        if (dto.code !== undefined)
            data.code = dto.code.toUpperCase();
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.value !== undefined)
            data.value = dto.value;
        if (dto.usageLimit !== undefined)
            data.usageLimit = dto.usageLimit;
        if (dto.maxDiscountAmount !== undefined)
            data.maxDiscountAmount = dto.maxDiscountAmount;
        if (dto.validFrom !== undefined)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validUntil !== undefined)
            data.validUntil = new Date(dto.validUntil);
        if (dto.applicableEventIds !== undefined)
            data.applicableEventIds = dto.applicableEventIds;
        if (dto.eventId !== undefined)
            data.eventId = dto.eventId;
        return this.prisma.voucher.update({
            where: { id },
            data,
        });
    }
    async deactivate(id, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const voucher = await this.prisma.voucher.findUnique({
            where: { id },
        });
        if (!voucher || voucher.organizerId !== organizer.id) {
            throw new common_1.NotFoundException('Voucher tidak ditemukan');
        }
        return this.prisma.voucher.update({
            where: { id },
            data: { status: 'inactive' },
        });
    }
    async validateVoucher(code, eventId, totalAmount) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        const voucher = await this.prisma.voucher.findFirst({
            where: {
                code: code.toUpperCase(),
                organizerId: event.organizerId,
            },
        });
        if (!voucher) {
            throw new common_1.BadRequestException('Kode voucher tidak valid');
        }
        if (voucher.status !== 'active') {
            throw new common_1.BadRequestException('Voucher sudah tidak aktif atau kedaluwarsa');
        }
        const now = new Date();
        if (now < voucher.validFrom || now > voucher.validUntil) {
            throw new common_1.BadRequestException('Voucher berada di luar periode masa berlaku');
        }
        if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
            throw new common_1.BadRequestException('Kuota penggunaan voucher sudah habis');
        }
        if (voucher.eventId && voucher.eventId !== eventId) {
            throw new common_1.BadRequestException('Voucher tidak berlaku untuk event ini');
        }
        if (voucher.applicableEventIds &&
            Array.isArray(voucher.applicableEventIds) &&
            voucher.applicableEventIds.length > 0 &&
            !voucher.applicableEventIds.includes(eventId)) {
            throw new common_1.BadRequestException('Voucher tidak berlaku untuk event ini');
        }
        let discount = 0;
        if (voucher.type === 'percentage') {
            discount = (totalAmount * voucher.value) / 100;
            if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
                discount = voucher.maxDiscountAmount;
            }
        }
        else {
            discount = voucher.value;
        }
        discount = Math.min(discount, totalAmount);
        return {
            valid: true,
            voucherId: voucher.id,
            code: voucher.code,
            type: voucher.type,
            value: voucher.value,
            discountAmount: discount,
        };
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map