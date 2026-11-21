export declare class TicketCategoryFeeItemDto {
    id: string;
    internetFee: number;
}
export declare class UpdateEventFeeDto {
    id?: string;
    internetFee: number;
    applyToAllCategories?: boolean;
    categories?: TicketCategoryFeeItemDto[];
}
