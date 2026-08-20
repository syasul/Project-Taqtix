import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import type { Request, Response } from 'express';
export declare class AffiliatesController {
    private readonly affiliatesService;
    constructor(affiliatesService: AffiliatesService);
    redirectAffiliate(code: string, req: Request, res: Response): Promise<void>;
    createAffiliate(eventId: string, dto: CreateAffiliateDto, userId: string): Promise<any>;
    getAffiliates(eventId: string, userId: string): Promise<any>;
    getLeaderboard(eventId: string, userId: string): Promise<any>;
}
