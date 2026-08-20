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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyEventOwnership(eventId, organizerUserId) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId: organizerUserId },
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
        return event;
    }
    async getEventDashboard(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const paidOrders = await this.prisma.order.findMany({
            where: { eventId, status: client_1.OrderStatus.PAID },
            include: {
                orderItems: true,
            },
        });
        const pendingOrdersCount = await this.prisma.order.count({
            where: { eventId, status: client_1.OrderStatus.PENDING },
        });
        const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const ticketsSold = paidOrders.reduce((acc, o) => acc + o.orderItems.reduce((sum, item) => sum + item.qty, 0), 0);
        return {
            eventId,
            totalRevenue,
            ticketsSold,
            completedTransactions: paidOrders.length,
            pendingTransactions: pendingOrdersCount,
        };
    }
    async getBuyers(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const orders = await this.prisma.order.findMany({
            where: { eventId, status: client_1.OrderStatus.PAID },
            include: {
                orderItems: {
                    include: {
                        ticketType: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => ({
            orderId: o.id,
            buyerName: o.buyerName,
            buyerEmail: o.buyerEmail,
            buyerPhone: o.buyerPhone,
            totalAmount: o.totalAmount,
            purchaseDate: o.createdAt,
            items: o.orderItems.map((item) => ({
                ticketCategory: item.ticketType.name,
                qty: item.qty,
                price: item.price,
            })),
        }));
    }
    async getBuyersCsv(eventId, organizerUserId) {
        const buyers = await this.getBuyers(eventId, organizerUserId);
        let csvContent = 'Nama,Email,No. WhatsApp,Total Bayar (Rp),Tanggal Pembelian\n';
        for (const b of buyers) {
            const cleanName = b.buyerName.replace(/"/g, '""');
            const cleanEmail = b.buyerEmail.replace(/"/g, '""');
            const phone = b.buyerPhone || '';
            const dateStr = b.purchaseDate.toISOString();
            csvContent += `"${cleanName}","${cleanEmail}","${phone}",${b.totalAmount},"${dateStr}"\n`;
        }
        return csvContent;
    }
    async getChannelPerformance(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const affiliates = await this.prisma.affiliatePartner.findMany({
            where: { eventId },
            include: {
                orders: {
                    where: { status: client_1.OrderStatus.PAID },
                },
            },
        });
        const affiliatePerformance = affiliates.map((aff) => {
            const salesCount = aff.orders.length;
            const totalRevenue = aff.orders.reduce((sum, o) => sum + o.totalAmount, 0);
            return {
                partnerId: aff.id,
                partnerName: aff.name,
                partnerType: aff.type,
                clicks: aff.totalClicks,
                salesCount,
                revenueGenerated: totalRevenue,
                commissionEarned: aff.commission,
                conversionRate: aff.totalClicks > 0 ? parseFloat(((salesCount / aff.totalClicks) * 100).toFixed(2)) : 0.0,
            };
        });
        const organicOrders = await this.prisma.order.findMany({
            where: {
                eventId,
                status: client_1.OrderStatus.PAID,
                affiliatePartnerId: null,
            },
        });
        const organicRevenue = organicOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        return {
            eventId,
            channels: {
                organic: {
                    salesCount: organicOrders.length,
                    revenueGenerated: organicRevenue,
                },
                affiliates: affiliatePerformance,
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map