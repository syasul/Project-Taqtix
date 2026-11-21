import { PrismaService } from '../prisma/prisma.service';
import { GenerateSeatsDto } from './dto/generate-seats.dto';
export declare class SeatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerEventOrThrow;
    private releaseExpiredLocks;
    getPublicEventSeating(slugOrId: string): Promise<{
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
    }>;
    getOrganizerSeating(eventId: string, userId: string): Promise<({
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
    })[]>;
    generateSectionSeats(eventId: string, userId: string, dto: GenerateSeatsDto): Promise<({
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
    }) | null>;
    toggleSeatStatus(eventId: string, seatId: string, userId: string): Promise<{
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
    }>;
    deleteSection(eventId: string, sectionId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    lockSeats(slugOrId: string, seatIds: string[], orderId?: string): Promise<{
        success: boolean;
        lockedCount: number;
        lockedUntil: Date;
    }>;
    releaseSeats(seatIds: string[], orderId?: string): Promise<{
        success: boolean;
    }>;
    private generateRowList;
}
