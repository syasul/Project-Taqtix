export declare class PosItemDto {
    type: 'ticket' | 'facility';
    refId: string;
    name: string;
    qty: number;
    unitPrice: number;
}
export declare class CreatePosTransactionDto {
    items: PosItemDto[];
    paymentMethod: 'cash' | 'qris' | 'debit';
    buyerName?: string;
    buyerPhone?: string;
}
