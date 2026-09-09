export declare class CreatePartnerDto {
    name: string;
    eventId: string;
    type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
    uniqueCode: string;
    promoCode?: string;
    commissionType?: string;
    commissionValue?: number;
    email?: string;
    password?: string;
    idCardNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
}
