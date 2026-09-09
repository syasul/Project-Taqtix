"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ExportsService = class ExportsService {
    prisma;
    configService;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getExportsDirectory() {
        const baseUploadDir = this.configService.get('UPLOAD_STORAGE_PATH') ||
            path.join(process.cwd(), 'uploads');
        const exportsDir = path.join(baseUploadDir, 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        return exportsDir;
    }
    handleCsvResult(filename, csv, rowCount) {
        if (rowCount > 1000) {
            const exportDir = this.getExportsDirectory();
            const filePath = path.join(exportDir, filename);
            fs.writeFileSync(filePath, csv, 'utf-8');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            return {
                isAsync: true,
                filename,
                csv,
                downloadUrl: `/uploads/exports/${filename}`,
                expiresAt,
            };
        }
        return {
            isAsync: false,
            filename,
            csv,
        };
    }
    async cleanExpiredExports() {
        try {
            const exportDir = this.getExportsDirectory();
            if (!fs.existsSync(exportDir))
                return;
            const files = fs.readdirSync(exportDir);
            const now = Date.now();
            const maxAgeMs = 24 * 60 * 60 * 1000;
            for (const file of files) {
                const filePath = path.join(exportDir, file);
                try {
                    const stat = fs.statSync(filePath);
                    if (now - stat.mtimeMs > maxAgeMs) {
                        fs.unlinkSync(filePath);
                    }
                }
                catch {
                }
            }
        }
        catch (err) {
            console.error('[ExportsCleaner] Gagal membersihkan file ekspor lama:', err);
        }
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
        const customFields = await this.prisma.customFormField.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
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
            ...customFields.map((f) => `"${f.label.replace(/"/g, '""')}"`),
            'CreatedAt',
        ];
        const rows = [];
        for (const ord of orders) {
            for (const item of ord.orderItems) {
                const customAnswers = item.customFieldAnswers || {};
                const customValues = customFields.map((f) => {
                    const val = customAnswers[f.id] ?? customAnswers[f.label] ?? '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                });
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
                    ...customValues,
                    `"${ord.createdAt.toISOString()}"`,
                ].join(','));
            }
        }
        const csv = [headers.join(','), ...rows].join('\n');
        return this.handleCsvResult(`orders-export-${eventId}-${Date.now()}.csv`, csv, rows.length);
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
        return this.handleCsvResult(`attendance-export-${eventId}-${Date.now()}.csv`, csv, rows.length);
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
        const headers = [
            'EventTitle',
            'TotalOrdersPaid',
            'OnlineRevenue',
            'TotalDiscount',
            'CashInTotal',
            'GrossSales',
        ];
        const row = [
            `"${event.title.replace(/"/g, '""')}"`,
            orders.length,
            totalRevenue,
            totalDiscount,
            totalCashIn,
            totalRevenue + totalCashIn,
        ];
        const csv = [headers.join(','), row.join(',')].join('\n');
        return this.handleCsvResult(`financial-summary-${eventId}-${Date.now()}.csv`, csv, 1);
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
        return this.handleCsvResult(`cross-event-summary-${organizer.id}-${Date.now()}.csv`, csv, rows.length);
    }
};
exports.ExportsService = ExportsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExportsService.prototype, "cleanExpiredExports", null);
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map