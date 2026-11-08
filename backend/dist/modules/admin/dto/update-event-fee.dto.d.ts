export declare class TicketCategoryFeeItemDto {
    id: string;
    internetFee: number;
}
export declare class UpdateEventFeeDto {
    internetFee: number;
    applyToAllCategories?: boolean;
    categories?: TicketCategoryFeeItemDto[];
}
