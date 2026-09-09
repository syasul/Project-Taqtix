import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import type { Request, Response } from 'express';
export declare class AffiliatesController {
    private readonly affiliatesService;
    constructor(affiliatesService: AffiliatesService);
    redirectAffiliate(code: string, req: Request, res: Response): Promise<void>;
    trackClick(code: string, req: Request): Promise<{
        success: boolean;
    }>;
    createAffiliate(eventId: string, dto: CreateAffiliateDto, userId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        bankName: string | null;
        bankAccountNumber: string | null;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
        idCardNumber: string | null;
        bankAccountName: string | null;
    }>;
    getAffiliates(eventId: string, userId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        bankName: string | null;
        bankAccountNumber: string | null;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
        idCardNumber: string | null;
        bankAccountName: string | null;
    }[]>;
    getLeaderboard(eventId: string, userId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        bankName: string | null;
        bankAccountNumber: string | null;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
        idCardNumber: string | null;
        bankAccountName: string | null;
    }[]>;
    requestMagicLink(email: string): Promise<{
        success: boolean;
        token: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    getPartnerStats(partnerId: string): Promise<{
        success: boolean;
        data: {
            partnerId: string;
            name: string;
            uniqueCode: string;
            uniqueLink: string;
            eventName: string;
            eventSlug: string;
            clicks: number;
            conversions: number;
            revenueGenerated: number;
            commissionEarned: number;
            commissionPct: number;
            ranking: number;
            totalPartners: number;
            recentSales: {
                orderId: string;
                amount: number;
                date: Date;
            }[];
            payoutHistory: {
                id: string;
                date: Date;
                amount: number;
                status: string;
                bankAccount: string;
            }[];
        };
    }>;
    generateAffiliateCode(partnerId: string, customCode?: string): Promise<{
        success: boolean;
        data: {
            uniqueCode: string;
            uniqueLink: string;
        };
    }>;
    requestPayout(partnerId: string, amount?: number): Promise<{
        success: boolean;
        data: {
            payoutId: string;
            amount: number;
            status: string;
            requestedAt: Date;
        };
    }>;
}
