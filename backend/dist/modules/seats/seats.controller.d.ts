import { SeatsService } from './seats.service';
import { GenerateSeatsDto } from './dto/generate-seats.dto';
import { LockSeatsDto, ReleaseSeatsDto } from './dto/lock-seats.dto';
export declare class SeatsController {
    private readonly seatsService;
    constructor(seatsService: SeatsService);
    getPublicSeating(slugOrId: string): Promise<{
        success: boolean;
        data: {
            hasSeatingLayout: boolean;
            sections: never[];
            eventId?: undefined;
        } | {
            hasSeatingLayout: boolean;
            eventId: string;
            sections: ({
                ticketCategory: {
                    id: string;
                    name: string;
                    price: number;
                    quota: number;
                    sold: number;
                } | null;
                seats: {
                    id: string;
                    status: import("@prisma/client").$Enums.SeatStatus;
                    seatNumber: string;
                    ticketCategoryId: string;
                    row: string;
                    col: number;
                    lockedUntil: Date | null;
                }[];
            } & {
                order: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                eventId: string;
                ticketCategoryId: string | null;
                stagePosition: string;
            })[];
        };
    }>;
    lockSeats(slugOrId: string, dto: LockSeatsDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
            lockedCount: number;
            lockedUntil: Date;
        };
    }>;
    releaseSeats(dto: ReleaseSeatsDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
    getOrganizerSeating(eventId: string, userId: string): Promise<{
        success: boolean;
        data: ({
            ticketCategory: {
                id: string;
                name: string;
                price: number;
                quota: number;
                sold: number;
            } | null;
            seats: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.SeatStatus;
                orderItemId: string | null;
                seatNumber: string;
                ticketCategoryId: string;
                ticketId: string | null;
                row: string;
                col: number;
                lockedUntil: Date | null;
                lockedByOrderId: string | null;
                sectionId: string;
            }[];
        } & {
            order: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            ticketCategoryId: string | null;
            stagePosition: string;
        })[];
    }>;
    generateSeats(eventId: string, userId: string, dto: GenerateSeatsDto): Promise<{
        success: boolean;
        data: ({
            ticketCategory: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                internetFee: number | null;
                eventId: string;
                price: number;
                quota: number;
                sold: number;
                maxPerOrder: number;
                ticketPerPackage: number;
                saleStartAt: Date;
                saleEndAt: Date;
            } | null;
            seats: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.SeatStatus;
                orderItemId: string | null;
                seatNumber: string;
                ticketCategoryId: string;
                ticketId: string | null;
                row: string;
                col: number;
                lockedUntil: Date | null;
                lockedByOrderId: string | null;
                sectionId: string;
            }[];
        } & {
            order: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            ticketCategoryId: string | null;
            stagePosition: string;
        }) | null;
    }>;
    toggleSeat(eventId: string, seatId: string, userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.SeatStatus;
            orderItemId: string | null;
            seatNumber: string;
            ticketCategoryId: string;
            ticketId: string | null;
            row: string;
            col: number;
            lockedUntil: Date | null;
            lockedByOrderId: string | null;
            sectionId: string;
        };
    }>;
    deleteSection(eventId: string, sectionId: string, userId: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
        };
    }>;
}
