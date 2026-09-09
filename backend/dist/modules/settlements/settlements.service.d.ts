import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class SettlementsService implements OnModuleInit {
    private readonly prisma;
    private timer;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    calculatePendingSettlements(): Promise<{
        processed: number;
        settlements: any[];
    }>;
    getSettlements(): Promise<({
        organizer: {
            user: {
                email: string;
            };
            id: string;
            name: string;
            phone: string | null;
            bankAccount: string | null;
        };
        event: {
            title: string;
            id: string;
            location: string;
            endDate: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string;
        paidAt: Date | null;
        grossRevenue: number;
        platformFee: number;
        affiliateCommissionTotal: number;
        netAmount: number;
        paidBy: string | null;
    })[]>;
    markSettlementPaid(settlementId: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        organizerId: string;
        eventId: string;
        paidAt: Date | null;
        grossRevenue: number;
        platformFee: number;
        affiliateCommissionTotal: number;
        netAmount: number;
        paidBy: string | null;
    }>;
}
