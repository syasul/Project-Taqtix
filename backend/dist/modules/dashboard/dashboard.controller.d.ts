import { DashboardService } from './dashboard.service';
import type { Response } from 'express';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(userId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getEventDashboard(eventId: string, userId: string): Promise<{
        eventId: string;
        totalRevenue: number;
        ticketsSold: number;
        completedTransactions: number;
        pendingTransactions: number;
    }>;
    getBuyers(eventId: string, userId: string): Promise<{
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
    exportBuyers(eventId: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getChannelPerformance(eventId: string, userId: string): Promise<{
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
        success: boolean;
        data: {
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
        };
    }>;
    getDistributionAnalytics(eventId: string, userId: string): Promise<{
        success: boolean;
        data: {
            byChannel: {
                channel: string;
                buyers: number;
                revenue: number;
            }[];
        };
    }>;
    getAudienceAnalytics(eventId: string, userId: string): Promise<{
        success: boolean;
        data: {
            totalBuyers: number;
            newBuyers: number;
            returningBuyers: number;
            topCities: {
                city: string;
                count: number;
            }[];
            repeatPurchaseRate: number;
        };
    }>;
    private prismaGetAudience;
    getPerformanceAnalytics(eventId: string, userId: string): Promise<{
        success: boolean;
        data: {
            landingPageViews: number;
            checkoutStarted: number;
            checkoutCompleted: number;
            conversionRate: number;
            avgCheckoutTimeSeconds: number;
            refundRate: number;
        };
    }>;
    recordAdSpend(eventId: string, dto: {
        channel: string;
        amount: number;
        periodStart: string;
        periodEnd: string;
    }, userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            amount: number;
            channel: string;
            periodStart: Date;
            periodEnd: Date;
            inputBy: string;
        };
    }>;
    getGrowthDashboard(eventId: string, userId: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    trackPageView(eventId: string): Promise<{
        success: boolean;
    }>;
    trackCheckoutStarted(eventId: string): Promise<{
        success: boolean;
    }>;
}
