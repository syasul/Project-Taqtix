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
}
