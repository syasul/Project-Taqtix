export declare class GenerateSeatsDto {
    sectionName: string;
    ticketCategoryId?: string;
    stagePosition?: string;
    rowStart: string;
    rowEnd: string;
    seatsPerRow: number;
    aisleAfterSeats?: number[];
    disabledSeatNumbers?: string[];
}
