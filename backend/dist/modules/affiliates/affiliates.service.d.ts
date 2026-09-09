import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { AuthService } from '../auth/auth.service';
export declare class AffiliatesService {
    private readonly prisma;
    private readonly configService;
    private readonly authService;
    constructor(prisma: PrismaService, configService: ConfigService, authService: AuthService);
    private verifyEventOwnership;
    create(eventId: string, dto: CreateAffiliateDto, organizerUserId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }>;
    registerClickAndGetUrl(code: string, ipAddress?: string, userAgent?: string): Promise<string>;
    findAll(eventId: string, organizerUserId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
    getLeaderboard(eventId: string, organizerUserId: string): Promise<{
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        email: string | null;
        id: string;
        passwordHash: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        uniqueCode: string;
        eventId: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
    requestMagicLink(email: string): Promise<{
        success: boolean;
        token: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getPartnerStats(partnerId: string): Promise<{
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
    }>;
    generateCode(partnerId: string, customCode?: string): Promise<{
        uniqueCode: string;
        uniqueLink: string;
    }>;
    requestPayout(partnerId: string, amount?: number): Promise<{
        payoutId: string;
        amount: number;
        status: string;
        requestedAt: Date;
    }>;
}
