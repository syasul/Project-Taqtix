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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
let DashboardService = class DashboardService {
    prisma;
    configService;
    redis = null;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        try {
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
            });
            this.redis.on('error', (err) => {
                console.warn('Redis client error:', err.message);
            });
        }
        catch (err) {
            console.warn('Gagal inisialisasi Redis client:', err);
        }
    }
    async verifyEventOwnership(eventId, organizerUserId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId: organizerUserId, status: 'active' },
        });
        let organizerId = member?.organizerId;
        if (!organizerId) {
            const organizer = await this.prisma.organizer.findUnique({
                where: { userId: organizerUserId },
            });
            if (!organizer) {
                throw new common_1.ForbiddenException('Akses ditolak: Anda bukan organizer');
            }
            organizerId = organizer.id;
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizerId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
        return event;
    }
    async getOrganizerId(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
        });
        if (member)
            return member.organizerId;
        const org = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!org) {
            throw new common_1.ForbiddenException('Profil organizer tidak ditemukan');
        }
        return org.id;
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
    async getOverview(userId) {
        const cacheKey = `dashboard:overview:${userId}`;
        if (this.redis) {
            try {
                const cachedData = await this.redis.get(cacheKey);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            }
            catch (err) {
                console.warn('Redis read failed:', err);
            }
        }
        const result = await this.calculateOverview(userId);
        if (this.redis) {
            try {
                await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
            }
            catch (err) {
                console.warn('Redis write failed:', err);
            }
        }
        return result;
    }
    async calculateOverview(userId) {
        const organizerId = await this.getOrganizerId(userId);
        const events = await this.prisma.event.findMany({
            where: { organizerId },
        });
        const eventIds = events.map((e) => e.id);
        const paidOrders = await this.prisma.order.findMany({
            where: {
                eventId: { in: eventIds },
                status: client_1.OrderStatus.PAID,
            },
            include: {
                orderItems: true,
            },
        });
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const ticketsSold = paidOrders.reduce((sum, o) => sum + o.orderItems.reduce((acc, item) => acc + item.qty, 0), 0);
        const now = new Date();
        const runningEventsCount = await this.prisma.event.count({
            where: {
                organizerId,
                status: client_1.EventStatus.PUBLISHED,
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });
        const monthlyTrends = {};
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
            months.push(label);
            monthlyTrends[label] = 0;
        }
        for (const order of paidOrders) {
            const orderMonth = order.createdAt.toLocaleString('id-ID', {
                month: 'short',
                year: '2-digit',
            });
            if (monthlyTrends[orderMonth] !== undefined) {
                monthlyTrends[orderMonth] += order.totalAmount;
            }
        }
        const trends = months.map((month) => ({
            month,
            revenue: monthlyTrends[month],
        }));
        return {
            totalRevenue,
            ticketsSold,
            activeEvents: runningEventsCount,
            trends,
        };
    }
    async getBuyers(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const orders = await this.prisma.order.findMany({
            where: { eventId, status: client_1.OrderStatus.PAID },
            include: {
                orderItems: {
                    include: {
                        ticketCategory: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => {
            const firstItem = o.orderItems[0];
            return {
                orderId: o.id,
                buyerName: firstItem?.attendeeName || 'Guest',
                buyerEmail: firstItem?.attendeeEmail || '',
                buyerPhone: firstItem?.attendeePhone || '',
                totalAmount: o.totalAmount,
                purchaseDate: o.createdAt,
                items: o.orderItems.map((item) => ({
                    ticketCategory: item.ticketCategory.name,
                    qty: item.qty,
                    price: item.unitPrice,
                })),
            };
        });
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
        const affiliates = await this.prisma.partner.findMany({
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
                clicks: aff.clicks,
                salesCount,
                revenueGenerated: totalRevenue,
                commissionEarned: aff.commissionEarned,
                conversionRate: aff.clicks > 0
                    ? parseFloat(((salesCount / aff.clicks) * 100).toFixed(2))
                    : 0.0,
            };
        });
        const organicOrders = await this.prisma.order.findMany({
            where: {
                eventId,
                status: client_1.OrderStatus.PAID,
                partnerId: null,
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
    async getSalesAnalytics(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const paidOrderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    eventId,
                    status: client_1.OrderStatus.PAID,
                },
            },
            include: {
                ticketCategory: true,
            },
        });
        const categoryMap = new Map();
        for (const item of paidOrderItems) {
            const catName = item.ticketCategory.name;
            if (!categoryMap.has(catName)) {
                categoryMap.set(catName, { categoryName: catName, sold: 0, revenue: 0 });
            }
            const data = categoryMap.get(catName);
            data.sold += item.qty;
            data.revenue += item.qty * item.unitPrice;
        }
        const dayMap = new Map();
        for (const item of paidOrderItems) {
            const dateStr = item.createdAt.toISOString().split('T')[0];
            if (!dayMap.has(dateStr)) {
                dayMap.set(dateStr, { date: dateStr, sold: 0, revenue: 0 });
            }
            const data = dayMap.get(dateStr);
            data.sold += item.qty;
            data.revenue += item.qty * item.unitPrice;
        }
        const byCategory = Array.from(categoryMap.values());
        const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        return {
            byCategory,
            byDay,
        };
    }
    async getDistributionAnalytics(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const paidOrders = await this.prisma.order.findMany({
            where: {
                eventId,
                status: client_1.OrderStatus.PAID,
            },
        });
        const channels = {
            organic: { channel: 'organic', buyers: 0, revenue: 0 },
            affiliate: { channel: 'affiliate', buyers: 0, revenue: 0 },
        };
        for (const order of paidOrders) {
            let ch = 'organic';
            if (order.partnerId) {
                ch = 'affiliate';
            }
            else if (order.utmSource) {
                ch = order.utmSource;
            }
            if (!channels[ch]) {
                channels[ch] = { channel: ch, buyers: 0, revenue: 0 };
            }
            channels[ch].buyers += 1;
            channels[ch].revenue += order.totalAmount;
        }
        return {
            byChannel: Array.from(Object.values(channels)),
        };
    }
    async getAudienceAnalytics(eventId, userId) {
        const event = await this.verifyEventOwnership(eventId, userId);
        const organizerId = event.organizerId;
        const paidOrderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    eventId,
                    status: client_1.OrderStatus.PAID,
                },
            },
        });
        const uniqueEmails = Array.from(new Set(paidOrderItems.map((o) => o.attendeeEmail)));
        const totalBuyers = uniqueEmails.length;
        let newBuyersCount = 0;
        let returningBuyersCount = 0;
        for (const email of uniqueEmails) {
            const prevOrderCount = await this.prisma.order.count({
                where: {
                    eventId: { not: eventId },
                    event: { organizerId },
                    status: client_1.OrderStatus.PAID,
                    orderItems: {
                        some: {
                            attendeeEmail: email,
                        },
                    },
                },
            });
            if (prevOrderCount > 0) {
                returningBuyersCount++;
            }
            else {
                newBuyersCount++;
            }
        }
        const cityCounts = await this.prisma.orderItem.groupBy({
            by: ['city'],
            where: {
                order: {
                    eventId,
                    status: client_1.OrderStatus.PAID,
                },
                city: { not: null },
            },
            _count: {
                city: true,
            },
            orderBy: {
                _count: {
                    city: 'desc',
                },
            },
            take: 5,
        });
        const topCities = cityCounts.map((c) => ({
            city: c.city || 'Lainnya',
            count: c._count.city,
        }));
        const repeatPurchaseRate = totalBuyers > 0 ? parseFloat((returningBuyersCount / totalBuyers).toFixed(2)) : 0.0;
        return {
            totalBuyers,
            newBuyers: newBuyersCount,
            returningBuyers: returningBuyersCount,
            topCities,
            repeatPurchaseRate,
        };
    }
    async getPerformanceAnalytics(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const landingPageViews = await this.prisma.trackEvent.count({
            where: { eventId, type: 'page_view' },
        });
        const checkoutStarted = await this.prisma.trackEvent.count({
            where: { eventId, type: 'checkout_start' },
        });
        const allOrders = await this.prisma.order.findMany({
            where: { eventId },
            include: {
                payment: true,
            },
        });
        const paidOrders = allOrders.filter((o) => o.status === client_1.OrderStatus.PAID);
        const checkoutCompleted = paidOrders.length;
        let totalSeconds = 0;
        let validPaymentCount = 0;
        for (const order of paidOrders) {
            if (order.payment && order.payment.paidAt) {
                const diff = (order.payment.paidAt.getTime() - order.createdAt.getTime()) / 1000;
                if (diff > 0) {
                    totalSeconds += diff;
                    validPaymentCount++;
                }
            }
        }
        const avgCheckoutTimeSeconds = validPaymentCount > 0 ? Math.round(totalSeconds / validPaymentCount) : 0;
        const totalOrdersCount = allOrders.length;
        const refundedOrdersCount = allOrders.filter((o) => o.status === client_1.OrderStatus.REFUNDED).length;
        const refundRate = totalOrdersCount > 0 ? parseFloat((refundedOrdersCount / totalOrdersCount).toFixed(3)) : 0.0;
        const conversionRate = landingPageViews > 0 ? parseFloat((checkoutCompleted / landingPageViews).toFixed(3)) : 0.0;
        return {
            landingPageViews,
            checkoutStarted,
            checkoutCompleted,
            conversionRate,
            avgCheckoutTimeSeconds,
            refundRate,
        };
    }
    async recordAdSpend(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.adSpend.create({
            data: {
                eventId,
                channel: dto.channel,
                amount: dto.amount,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                inputBy: userId,
            },
        });
    }
    async getGrowthDashboard(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const adSpends = await this.prisma.adSpend.findMany({
            where: { eventId },
        });
        const spendMap = new Map();
        for (const spend of adSpends) {
            spendMap.set(spend.channel, (spendMap.get(spend.channel) || 0) + spend.amount);
        }
        const paidOrders = await this.prisma.order.findMany({
            where: { eventId, status: client_1.OrderStatus.PAID },
        });
        const revenueMap = new Map();
        for (const order of paidOrders) {
            if (order.utmSource) {
                revenueMap.set(order.utmSource, (revenueMap.get(order.utmSource) || 0) + order.totalAmount);
            }
        }
        const channelsList = Array.from(spendMap.keys());
        const allChannels = Array.from(new Set([...channelsList, ...Array.from(revenueMap.keys())]));
        const channels = allChannels.map((ch) => {
            const spend = spendMap.get(ch) || 0;
            const revenue = revenueMap.get(ch) || 0;
            const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : null;
            return {
                channel: ch,
                spend,
                revenue,
                roas,
            };
        });
        const topPartners = await this.prisma.partner.findMany({
            where: { eventId },
            orderBy: {
                revenueGenerated: 'desc',
            },
            take: 5,
        });
        const topAffiliates = topPartners.map((p) => ({
            partnerId: p.id,
            name: p.name,
            revenue: p.revenueGenerated,
            conversionRate: p.clicks > 0 ? parseFloat((p.conversions / p.clicks).toFixed(2)) : 0.0,
        }));
        return {
            channels,
            topAffiliates,
        };
    }
    async trackEvent(eventId, type) {
        if (type !== 'page_view' && type !== 'checkout_start') {
            throw new common_1.BadRequestException('Event type invalid');
        }
        return this.prisma.trackEvent.create({
            data: {
                eventId,
                type,
            },
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map