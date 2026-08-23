import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class DashboardService implements OnModuleInit {
    private readonly prisma;
    private readonly configService;
    private redis;
    constructor(prisma: PrismaService, configService: ConfigService);
    onModuleInit(): void;
    private verifyEventOwnership;
    private getOrganizerId;
    getEventDashboard(eventId: string, organizerUserId: string): Promise<{
        eventId: string;
        totalRevenue: number;
        ticketsSold: number;
        completedTransactions: number;
        pendingTransactions: number;
    }>;
    getOverview(userId: string): Promise<any>;
    private calculateOverview;
    getBuyers(eventId: string, organizerUserId: string): Promise<{
        orderId: string;
        buyerName: string;
        buyerEmail: string;
        buyerPhone: string;
        totalAmount: number;
        purchaseDate: Date;
        items: {
            ticketCategory: string;
            qty: number;
            price: number;
        }[];
    }[]>;
    getBuyersCsv(eventId: string, organizerUserId: string): Promise<string>;
    getChannelPerformance(eventId: string, organizerUserId: string): Promise<{
        eventId: string;
        channels: {
            organic: {
                salesCount: number;
                revenueGenerated: number;
            };
            affiliates: {
                partnerId: string;
                partnerName: string;
                partnerType: import("@prisma/client").$Enums.PartnerType;
                clicks: number;
                salesCount: number;
                revenueGenerated: number;
                commissionEarned: number;
                conversionRate: number;
            }[];
        };
    }>;
    getSalesAnalytics(eventId: string, userId: string): Promise<{
        byCategory: {
            categoryName: string;
            sold: number;
            revenue: number;
        }[];
        byDay: {
            date: string;
            sold: number;
            revenue: number;
        }[];
    }>;
    getDistributionAnalytics(eventId: string, userId: string): Promise<{
        byChannel: {
            channel: string;
            buyers: number;
            revenue: number;
        }[];
    }>;
    getAudienceAnalytics(eventId: string, userId: string): Promise<{
        totalBuyers: number;
        newBuyers: number;
        returningBuyers: number;
        topCities: {
            city: string;
            count: number;
        }[];
        repeatPurchaseRate: number;
    }>;
    getPerformanceAnalytics(eventId: string, userId: string): Promise<{
        landingPageViews: number;
        checkoutStarted: number;
        checkoutCompleted: number;
        conversionRate: number;
        avgCheckoutTimeSeconds: number;
        refundRate: number;
    }>;
    recordAdSpend(eventId: string, dto: {
        channel: string;
        amount: number;
        periodStart: string;
        periodEnd: string;
    }, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        amount: number;
        channel: string;
        periodStart: Date;
        periodEnd: Date;
        inputBy: string;
    }>;
    getGrowthDashboard(eventId: string, userId: string): Promise<{
        channels: {
            channel: string;
            spend: number;
            revenue: number;
            roas: number | null;
        }[];
        topAffiliates: {
            partnerId: string;
            name: string;
            revenue: number;
            conversionRate: number;
        }[];
    }>;
    trackEvent(eventId: string, type: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        eventId: string;
    }>;
}
