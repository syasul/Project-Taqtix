import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
export declare class AffiliatesService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private verifyEventOwnership;
    create(eventId: string, dto: CreateAffiliateDto, organizerUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }>;
    registerClickAndGetUrl(code: string, ipAddress?: string, userAgent?: string): Promise<string>;
    findAll(eventId: string, organizerUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
    getLeaderboard(eventId: string, organizerUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        promoCode: string | null;
        type: import("@prisma/client").$Enums.PartnerType;
        uniqueCode: string;
        commissionType: string;
        commissionValue: number;
        clicks: number;
        conversions: number;
        revenueGenerated: number;
        commissionEarned: number;
    }[]>;
}
