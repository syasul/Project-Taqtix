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
exports.DoorprizeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DoorprizeService = class DoorprizeService {
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
    async createItem(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.doorprizeItem.create({
            data: {
                eventId,
                name: dto.name,
                imageUrl: dto.imageUrl || null,
                quantity: dto.quantity,
                remainingQuantity: dto.quantity,
            },
        });
    }
    async listItems(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.doorprizeItem.findMany({
            where: { eventId },
            include: {
                winners: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async drawWinner(eventId, itemId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const item = await this.prisma.doorprizeItem.findUnique({
            where: { id: itemId },
            include: { winners: true },
        });
        if (!item || item.eventId !== eventId) {
            throw new common_1.NotFoundException('Hadiah doorprize tidak ditemukan');
        }
        if (item.remainingQuantity <= 0) {
            throw new common_1.BadRequestException('Kuantitas hadiah ini sudah habis terundi.');
        }
        const checkedInTickets = await this.prisma.ticket.findMany({
            where: {
                eventId,
                status: 'CHECKED_IN',
                isBlocked: false,
            },
            include: {
                orderItem: true,
            },
        });
        if (checkedInTickets.length === 0) {
            throw new common_1.BadRequestException('Belum ada pengunjung yang melakukan check-in untuk diundi.');
        }
        const existingWinners = await this.prisma.doorprizeWinner.findMany({
            where: {
                doorprizeItem: {
                    eventId,
                },
            },
            select: { ticketId: true, doorprizeItemId: true },
        });
        const excludeAll = dto.excludeWinnersFromPreviousDraws !== false;
        let eligibleTickets = checkedInTickets;
        if (excludeAll) {
            const wonTicketIds = new Set(existingWinners.map((w) => w.ticketId));
            eligibleTickets = checkedInTickets.filter((t) => !wonTicketIds.has(t.id));
        }
        else {
            const wonThisItemTicketIds = new Set(existingWinners
                .filter((w) => w.doorprizeItemId === itemId)
                .map((w) => w.ticketId));
            eligibleTickets = checkedInTickets.filter((t) => !wonThisItemTicketIds.has(t.id));
        }
        if (eligibleTickets.length === 0) {
            throw new common_1.BadRequestException('Semua pengunjung yang check-in sudah pernah memenangkan undian.');
        }
        const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
        const chosenTicket = eligibleTickets[randomIndex];
        return this.prisma.$transaction(async (tx) => {
            const winner = await tx.doorprizeWinner.create({
                data: {
                    doorprizeItemId: itemId,
                    ticketId: chosenTicket.id,
                    winnerName: chosenTicket.orderItem.attendeeName,
                    drawnBy: userId,
                },
            });
            await tx.doorprizeItem.update({
                where: { id: itemId },
                data: {
                    remainingQuantity: { decrement: 1 },
                },
            });
            return {
                success: true,
                winner: {
                    ...winner,
                    ticketId: chosenTicket.id,
                    attendeeEmail: chosenTicket.orderItem.attendeeEmail,
                    attendeePhone: chosenTicket.orderItem.attendeePhone,
                    prizeName: item.name,
                },
            };
        });
    }
    async listWinners(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.doorprizeWinner.findMany({
            where: {
                doorprizeItem: {
                    eventId,
                },
            },
            include: {
                doorprizeItem: true,
                ticket: {
                    include: {
                        orderItem: true,
                    },
                },
            },
            orderBy: { drawnAt: 'desc' },
        });
    }
};
exports.DoorprizeService = DoorprizeService;
exports.DoorprizeService = DoorprizeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DoorprizeService);
//# sourceMappingURL=doorprize.service.js.map