import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
export declare class AffiliatesService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private verifyEventOwnership;
    create(eventId: string, dto: CreateAffiliateDto, organizerUserId: string): Promise<any>;
    registerClickAndGetUrl(code: string, ipAddress?: string, userAgent?: string): Promise<string>;
    findAll(eventId: string, organizerUserId: string): Promise<any>;
    getLeaderboard(eventId: string, organizerUserId: string): Promise<any>;
}
