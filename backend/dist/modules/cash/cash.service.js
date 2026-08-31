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
exports.CashService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CashService = class CashService {
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
    async recordCash(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.cashTransaction.create({
            data: {
                eventId,
                type: dto.type,
                amount: dto.amount,
                relatedOrderId: dto.relatedOrderId || null,
                relatedPosTransactionId: dto.relatedPosTransactionId || null,
                recordedBy: userId,
                note: dto.note || null,
            },
        });
    }
    async getEventCash(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const transactions = await this.prisma.cashTransaction.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
        const totalCashIn = transactions.reduce((acc, curr) => acc + curr.amount, 0);
        const breakdown = {
            ticket_sale: transactions
                .filter((t) => t.type === 'ticket_sale')
                .reduce((acc, t) => acc + t.amount, 0),
            merchandise_sale: transactions
                .filter((t) => t.type === 'merchandise_sale')
                .reduce((acc, t) => acc + t.amount, 0),
            facility_sale: transactions
                .filter((t) => t.type === 'facility_sale')
                .reduce((acc, t) => acc + t.amount, 0),
            other: transactions
                .filter((t) => t.type === 'other')
                .reduce((acc, t) => acc + t.amount, 0),
        };
        return {
            data: transactions,
            meta: {
                totalCashIn,
                breakdown,
                totalCount: transactions.length,
            },
        };
    }
    async getOrganizerCashSummary(userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const events = await this.prisma.event.findMany({
            where: { organizerId: organizer.id },
            select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                cashTransactions: true,
            },
        });
        let grandTotalCash = 0;
        const eventSummaries = events.map((ev) => {
            const totalCash = ev.cashTransactions.reduce((acc, t) => acc + t.amount, 0);
            grandTotalCash += totalCash;
            return {
                eventId: ev.id,
                eventTitle: ev.title,
                status: ev.status,
                startDate: ev.startDate,
                transactionCount: ev.cashTransactions.length,
                totalCash,
            };
        });
        return {
            grandTotalCash,
            totalEvents: events.length,
            events: eventSummaries,
        };
    }
};
exports.CashService = CashService;
exports.CashService = CashService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashService);
//# sourceMappingURL=cash.service.js.map