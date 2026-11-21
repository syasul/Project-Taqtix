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
exports.SeatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SeatsService = class SeatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerEventOrThrow(eventId, userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: {
                userId,
                status: 'active',
            },
            include: {
                organizer: true,
            },
        });
        const organizer = member?.organizer ||
            (await this.prisma.organizer.findUnique({
                where: { userId },
            }));
        if (!organizer) {
            throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pengelola event ini');
        }
        return event;
    }
    async releaseExpiredLocks(eventId) {
        const now = new Date();
        await this.prisma.seat.updateMany({
            where: {
                section: { eventId },
                status: client_1.SeatStatus.LOCKED,
                lockedUntil: { lt: now },
            },
            data: {
                status: client_1.SeatStatus.AVAILABLE,
                lockedUntil: null,
                lockedByOrderId: null,
            },
        });
    }
    async getPublicEventSeating(slugOrId) {
        const event = await this.prisma.event.findFirst({
            where: {
                OR: [{ slug: slugOrId }, { id: slugOrId }],
            },
            select: { id: true, title: true, slug: true, hasSeatingLayout: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (!event.hasSeatingLayout) {
            return {
                hasSeatingLayout: false,
                sections: [],
            };
        }
        await this.releaseExpiredLocks(event.id);
        const sections = await this.prisma.seatSection.findMany({
            where: { eventId: event.id },
            include: {
                ticketCategory: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        sold: true,
                        quota: true,
                    },
                },
                seats: {
                    select: {
                        id: true,
                        row: true,
                        col: true,
                        seatNumber: true,
                        status: true,
                        ticketCategoryId: true,
                        lockedUntil: true,
                    },
                    orderBy: [{ row: 'asc' }, { col: 'asc' }],
                },
            },
            orderBy: { order: 'asc' },
        });
        return {
            hasSeatingLayout: true,
            eventId: event.id,
            sections,
        };
    }
    async getOrganizerSeating(eventId, userId) {
        await this.getOrganizerEventOrThrow(eventId, userId);
        await this.releaseExpiredLocks(eventId);
        const sections = await this.prisma.seatSection.findMany({
            where: { eventId },
            include: {
                ticketCategory: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        quota: true,
                        sold: true,
                    },
                },
                seats: {
                    orderBy: [{ row: 'asc' }, { col: 'asc' }],
                },
            },
            orderBy: { order: 'asc' },
        });
        return sections;
    }
    async generateSectionSeats(eventId, userId, dto) {
        const event = await this.getOrganizerEventOrThrow(eventId, userId);
        if (!event.hasSeatingLayout) {
            await this.prisma.event.update({
                where: { id: eventId },
                data: { hasSeatingLayout: true },
            });
        }
        let ticketCatId = dto.ticketCategoryId;
        if (!ticketCatId) {
            const defaultCategory = await this.prisma.ticketCategory.findFirst({
                where: { eventId },
                orderBy: { price: 'asc' },
            });
            if (!defaultCategory) {
                throw new common_1.BadRequestException('Event belum memiliki kategori tiket. Buat kategori tiket terlebih dahulu.');
            }
            ticketCatId = defaultCategory.id;
        }
        const section = await this.prisma.seatSection.create({
            data: {
                eventId,
                name: dto.sectionName,
                ticketCategoryId: ticketCatId,
                stagePosition: dto.stagePosition || 'CENTER',
            },
        });
        const rows = this.generateRowList(dto.rowStart, dto.rowEnd);
        const disabledSet = new Set(dto.disabledSeatNumbers || []);
        const seatsToCreate = [];
        for (const row of rows) {
            for (let col = 1; col <= dto.seatsPerRow; col++) {
                const seatNumber = `${row}-${col}`;
                const isDisabled = disabledSet.has(seatNumber);
                seatsToCreate.push({
                    sectionId: section.id,
                    ticketCategoryId: ticketCatId,
                    row,
                    col,
                    seatNumber,
                    status: isDisabled ? client_1.SeatStatus.DISABLED : client_1.SeatStatus.AVAILABLE,
                });
            }
        }
        await this.prisma.seat.createMany({
            data: seatsToCreate,
        });
        return this.prisma.seatSection.findUnique({
            where: { id: section.id },
            include: {
                ticketCategory: true,
                seats: {
                    orderBy: [{ row: 'asc' }, { col: 'asc' }],
                },
            },
        });
    }
    async toggleSeatStatus(eventId, seatId, userId) {
        await this.getOrganizerEventOrThrow(eventId, userId);
        const seat = await this.prisma.seat.findUnique({
            where: { id: seatId },
            include: { section: true },
        });
        if (!seat || seat.section.eventId !== eventId) {
            throw new common_1.NotFoundException('Kursi tidak ditemukan');
        }
        if (seat.status === client_1.SeatStatus.BOOKED) {
            throw new common_1.BadRequestException('Kursi sudah dibeli dan tidak dapat diubah');
        }
        const nextStatus = seat.status === client_1.SeatStatus.DISABLED ? client_1.SeatStatus.AVAILABLE : client_1.SeatStatus.DISABLED;
        return this.prisma.seat.update({
            where: { id: seatId },
            data: { status: nextStatus },
        });
    }
    async deleteSection(eventId, sectionId, userId) {
        await this.getOrganizerEventOrThrow(eventId, userId);
        const section = await this.prisma.seatSection.findUnique({
            where: { id: sectionId },
        });
        if (!section || section.eventId !== eventId) {
            throw new common_1.NotFoundException('Seksi denah tidak ditemukan');
        }
        const bookedSeatCount = await this.prisma.seat.count({
            where: { sectionId, status: client_1.SeatStatus.BOOKED },
        });
        if (bookedSeatCount > 0) {
            throw new common_1.BadRequestException(`Tidak dapat menghapus seksi ini karena sudah terdapat ${bookedSeatCount} tiket kursi yang terjual.`);
        }
        await this.prisma.seatSection.delete({
            where: { id: sectionId },
        });
        return { success: true, message: 'Seksi denah berhasil dihapus' };
    }
    async lockSeats(slugOrId, seatIds, orderId) {
        const event = await this.prisma.event.findFirst({
            where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
            select: { id: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        await this.releaseExpiredLocks(event.id);
        const seats = await this.prisma.seat.findMany({
            where: {
                id: { in: seatIds },
                section: { eventId: event.id },
            },
        });
        if (seats.length !== seatIds.length) {
            throw new common_1.BadRequestException('Beberapa kursi yang dipilih tidak valid untuk acara ini');
        }
        const unavailableSeats = seats.filter((s) => s.status === client_1.SeatStatus.BOOKED ||
            s.status === client_1.SeatStatus.DISABLED ||
            (s.status === client_1.SeatStatus.LOCKED && s.lockedByOrderId && s.lockedByOrderId !== orderId));
        if (unavailableSeats.length > 0) {
            const numbers = unavailableSeats.map((s) => s.seatNumber).join(', ');
            throw new common_1.BadRequestException(`Kursi ${numbers} sedang dipesan atau tidak tersedia.`);
        }
        const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.seat.updateMany({
            where: { id: { in: seatIds } },
            data: {
                status: client_1.SeatStatus.LOCKED,
                lockedUntil,
                lockedByOrderId: orderId || null,
            },
        });
        return {
            success: true,
            lockedCount: seatIds.length,
            lockedUntil,
        };
    }
    async releaseSeats(seatIds, orderId) {
        await this.prisma.seat.updateMany({
            where: {
                id: { in: seatIds },
                status: client_1.SeatStatus.LOCKED,
                ...(orderId ? { lockedByOrderId: orderId } : {}),
            },
            data: {
                status: client_1.SeatStatus.AVAILABLE,
                lockedUntil: null,
                lockedByOrderId: null,
            },
        });
        return { success: true };
    }
    generateRowList(start, end) {
        const trimmedStart = start.trim().toUpperCase();
        const trimmedEnd = end.trim().toUpperCase();
        const startNum = parseInt(trimmedStart, 10);
        const endNum = parseInt(trimmedEnd, 10);
        if (!isNaN(startNum) && !isNaN(endNum)) {
            const min = Math.min(startNum, endNum);
            const max = Math.min(Math.max(startNum, endNum), min + 50);
            const list = [];
            for (let i = min; i <= max; i++) {
                list.push(String(i));
            }
            return list;
        }
        const startCode = trimmedStart.charCodeAt(0) || 65;
        const endCode = trimmedEnd.charCodeAt(0) || 65;
        const minCode = Math.min(startCode, endCode);
        const maxCode = Math.min(Math.max(startCode, endCode), minCode + 25);
        const list = [];
        for (let c = minCode; c <= maxCode; c++) {
            list.push(String.fromCharCode(c));
        }
        return list;
    }
};
exports.SeatsService = SeatsService;
exports.SeatsService = SeatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeatsService);
//# sourceMappingURL=seats.service.js.map