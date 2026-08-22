import { PartnerType } from '@prisma/client';
export declare class CreateAffiliateDto {
    name: string;
    type: PartnerType;
    commissionPct?: number;
    promoCode?: string;
}
