export declare class CreateVoucherDto {
    eventId?: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usageLimit?: number;
    maxDiscountAmount?: number;
    validFrom: string;
    validUntil: string;
    applicableEventIds?: string[];
}
