import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private verifyEventOwnership;
    getEventDashboard(eventId: string, organizerUserId: string): Promise<{
        eventId: string;
        totalRevenue: number;
        ticketsSold: number;
        completedTransactions: number;
        pendingTransactions: number;
    }>;
    getBuyers(eventId: string, organizerUserId: string): Promise<{
        orderId: string;
        buyerName: any;
        buyerEmail: any;
        buyerPhone: any;
        totalAmount: number;
        purchaseDate: Date;
        items: any;
    }[]>;
    getBuyersCsv(eventId: string, organizerUserId: string): Promise<string>;
    getChannelPerformance(eventId: string, organizerUserId: string): Promise<{
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
