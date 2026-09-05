export declare class UpdatePartnerDto {
    name?: string;
    eventId?: string;
    type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
    uniqueCode?: string;
    promoCode?: string;
    commissionType?: string;
    commissionValue?: number;
    email?: string;
}
