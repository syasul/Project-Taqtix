export declare class OrderItemDto {
    ticketCategoryId: string;
    qty: number;
}
export declare class CreateOrderDto {
    eventId: string;
    items: OrderItemDto[];
    promoCode?: string;
    affiliateCode?: string;
    buyerEmail: string;
    buyerName: string;
    buyerPhone?: string;
}
