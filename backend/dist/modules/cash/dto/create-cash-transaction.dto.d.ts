export declare class CreateCashTransactionDto {
    type: 'ticket_sale' | 'merchandise_sale' | 'facility_sale' | 'other';
    amount: number;
    relatedOrderId?: string;
    relatedPosTransactionId?: string;
    note?: string;
}
