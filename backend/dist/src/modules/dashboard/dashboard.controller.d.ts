import { DashboardService } from './dashboard.service';
import type { Response } from 'express';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
}
