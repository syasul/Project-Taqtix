import { PartnerType } from '@prisma/client';
export declare class CreateAffiliateDto {
    name: string;
    email?: string;
    type: PartnerType;
    commissionPct?: number;
    promoCode?: string;
    idCardNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
}
