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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        eventId: string;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }>;
    getAffiliates(eventId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        eventId: string;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
    getLeaderboard(eventId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        eventId: string;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
}
