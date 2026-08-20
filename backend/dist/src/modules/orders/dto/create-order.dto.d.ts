export declare class OrderItemDto {
    ticketTypeId: string;
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
