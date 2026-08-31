export declare class FacilityOrderDto {
    facilityId: string;
    qty: number;
}
export declare class OrderItemDto {
    ticketCategoryId: string;
    qty: number;
    customFieldAnswers?: Record<string, string>;
    facilities?: FacilityOrderDto[];
}
export declare class CreateOrderDto {
    eventId: string;
    items: OrderItemDto[];
    facilities?: FacilityOrderDto[];
    customFieldAnswers?: Record<string, string>;
    promoCode?: string;
    affiliateCode?: string;
    buyerEmail: string;
    buyerName: string;
    buyerPhone?: string;
    city?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}
