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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TicketsService = class TicketsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyEventOwnership(eventId, userId) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan organizer');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
    }
    async createCategory(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.ticketCategory.create({
            data: {
                eventId,
                name: dto.name,
                price: dto.price,
                quota: dto.quota,
                saleStartAt: new Date(dto.saleStart),
                saleEndAt: new Date(dto.saleEnd),
            },
        });
    }
    async updateCategory(id, dto, userId) {
        const ticketCategory = await this.prisma.ticketCategory.findUnique({
            where: { id },
        });
        if (!ticketCategory) {
            throw new common_1.NotFoundException('Kategori tiket tidak ditemukan');
        }
        await this.verifyEventOwnership(ticketCategory.eventId, userId);
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.price !== undefined)
            updateData.price = dto.price;
        if (dto.quota !== undefined)
            updateData.quota = dto.quota;
        if (dto.saleStart !== undefined)
            updateData.saleStartAt = new Date(dto.saleStart);
        if (dto.saleEnd !== undefined)
            updateData.saleEndAt = new Date(dto.saleEnd);
        return this.prisma.ticketCategory.update({
            where: { id },
            data: updateData,
        });
    }
    async getCategories(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        return this.prisma.ticketCategory.findMany({
            where: { eventId },
            orderBy: { price: 'asc' },
        });
    }
    async createPromoCode(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const existingPromo = await this.prisma.promoCode.findUnique({
            where: { code: dto.code },
        });
        if (existingPromo) {
            throw new common_1.BadRequestException('Kode promo ini sudah digunakan di sistem');
        }
        return this.prisma.promoCode.create({
            data: {
                eventId,
                code: dto.code,
                discount: dto.discount,
                maxUsage: dto.maxUsage,
            },
        });
    }
    async validatePromoCode(dto) {
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: dto.code },
        });
        if (!promo || promo.eventId !== dto.eventId) {
            throw new common_1.BadRequestException('Kode promo tidak valid untuk event ini');
        }
        if (promo.usedCount >= promo.maxUsage) {
            throw new common_1.BadRequestException('Kuota penggunaan kode promo sudah habis');
        }
        return {
            valid: true,
            promoCodeId: promo.id,
            code: promo.code,
            discount: promo.discount,
        };
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map