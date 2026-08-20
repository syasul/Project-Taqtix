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
        buyerName: any;
        buyerEmail: any;
        buyerPhone: any;
        totalAmount: number;
        purchaseDate: Date;
        items: any;
    }[]>;
    exportBuyers(eventId: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getChannelPerformance(eventId: string, userId: string): Promise<{
        eventId: string;
        channels: {
            organic: {
                salesCount: number;
                revenueGenerated: number;
            };
            affiliates: any;
        };
    }>;
}
