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
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExportsService = class ExportsService {
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
    async exportOrders(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const orders = await this.prisma.order.findMany({
            where: { eventId },
            include: {
                buyer: true,
                orderItems: {
                    include: {
                        ticketCategory: true,
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const headers = [
            'OrderID',
            'BuyerEmail',
            'Status',
            'TotalAmount',
            'DiscountAmount',
            'TicketCategory',
            'Qty',
            'AttendeeName',
            'AttendeePhone',
            'City',
            'PaymentMethod',
            'CreatedAt',
        ];
        const rows = [];
        for (const ord of orders) {
            for (const item of ord.orderItems) {
                rows.push([
                    `"${ord.id}"`,
                    `"${ord.buyer.email}"`,
                    `"${ord.status}"`,
                    ord.totalAmount,
                    ord.discountAmount,
                    `"${item.ticketCategory?.name || ''}"`,
                    item.qty,
                    `"${(item.attendeeName || '').replace(/"/g, '""')}"`,
                    `"${(item.attendeePhone || '').replace(/"/g, '""')}"`,
                    `"${(item.city || '').replace(/"/g, '""')}"`,
                    `"${ord.payment?.provider || ''}"`,
                    `"${ord.createdAt.toISOString()}"`,
                ].join(','));
            }
        }
        const csv = [headers.join(','), ...rows].join('\n');
        return {
            filename: `orders-export-${eventId}.csv`,
            csv,
        };
    }
    async exportAttendance(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const tickets = await this.prisma.ticket.findMany({
            where: { eventId },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
                staff: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const headers = [
            'TicketID',
            'AttendeeName',
            'AttendeeEmail',
            'AttendeePhone',
            'Category',
            'Status',
            'CheckedInAt',
            'StaffEmail',
            'WristbandCode',
            'IsBlocked',
        ];
        const rows = tickets.map((t) => [
            `"${t.id}"`,
            `"${(t.orderItem.attendeeName || '').replace(/"/g, '""')}"`,
            `"${(t.orderItem.attendeeEmail || '').replace(/"/g, '""')}"`,
            `"${(t.orderItem.attendeePhone || '').replace(/"/g, '""')}"`,
            `"${(t.orderItem.ticketCategory?.name || '').replace(/"/g, '""')}"`,
            `"${t.status}"`,
            `"${t.checkedInAt ? t.checkedInAt.toISOString() : ''}"`,
            `"${t.staff?.email || ''}"`,
            `"${t.wristbandCode || ''}"`,
            t.isBlocked ? 'YES' : 'NO',
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return {
            filename: `attendance-export-${eventId}.csv`,
            csv,
        };
    }
    async exportFinancialSummary(eventId, userId) {
        const { event } = await this.verifyEventOwnership(eventId, userId);
        const orders = await this.prisma.order.findMany({
            where: { eventId, status: 'PAID' },
        });
        const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
        const totalDiscount = orders.reduce((acc, o) => acc + o.discountAmount, 0);
        const cashTxs = await this.prisma.cashTransaction.findMany({
            where: { eventId },
        });
        const totalCashIn = cashTxs.reduce((acc, c) => acc + c.amount, 0);
        const headers = ['EventTitle', 'TotalOrdersPaid', 'OnlineRevenue', 'TotalDiscount', 'CashInTotal', 'GrossSales'];
        const row = [
            `"${event.title.replace(/"/g, '""')}"`,
            orders.length,
            totalRevenue,
            totalDiscount,
            totalCashIn,
            totalRevenue + totalCashIn,
        ];
        const csv = [headers.join(','), row.join(',')].join('\n');
        return {
            filename: `financial-summary-${eventId}.csv`,
            csv,
        };
    }
    async exportCrossEventSummary(userId, from, to) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const where = { organizerId: organizer.id };
        if (from || to) {
            where.startDate = {};
            if (from)
                where.startDate.gte = new Date(from);
            if (to)
                where.startDate.lte = new Date(to);
        }
        const events = await this.prisma.event.findMany({
            where,
            include: {
                orders: { where: { status: 'PAID' } },
                tickets: true,
                cashTransactions: true,
            },
            orderBy: { startDate: 'desc' },
        });
        const headers = [
            'EventID',
            'EventTitle',
            'Status',
            'StartDate',
            'PaidOrdersCount',
            'TicketsSold',
            'TicketsCheckedIn',
            'OnlineRevenue',
            'CashRevenue',
            'TotalRevenue',
        ];
        const rows = events.map((ev) => {
            const onlineRev = ev.orders.reduce((acc, o) => acc + o.totalAmount, 0);
            const cashRev = ev.cashTransactions.reduce((acc, c) => acc + c.amount, 0);
            const checkedIn = ev.tickets.filter((t) => t.status === 'CHECKED_IN').length;
            return [
                `"${ev.id}"`,
                `"${ev.title.replace(/"/g, '""')}"`,
                `"${ev.status}"`,
                `"${ev.startDate.toISOString()}"`,
                ev.orders.length,
                ev.tickets.length,
                checkedIn,
                onlineRev,
                cashRev,
                onlineRev + cashRev,
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        return {
            filename: `cross-event-summary-${organizer.id}.csv`,
            csv,
        };
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map