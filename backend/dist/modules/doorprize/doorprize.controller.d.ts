import { DoorprizeService } from './doorprize.service';
import { CreateDoorprizeDto } from './dto/create-doorprize.dto';
import { DrawDoorprizeDto } from './dto/draw-doorprize.dto';
export declare class DoorprizeController {
    private readonly doorprizeService;
    constructor(doorprizeService: DoorprizeService);
    createItem(eventId: string, dto: CreateDoorprizeDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        imageUrl: string | null;
        quantity: number;
        remainingQuantity: number;
    }>;
    listItems(eventId: string, userId: string): Promise<({
        winners: {
            id: string;
            ticketId: string;
            doorprizeItemId: string;
            winnerName: string;
            drawnAt: Date;
            drawnBy: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        imageUrl: string | null;
        quantity: number;
        remainingQuantity: number;
    })[]>;
    drawWinner(eventId: string, itemId: string, dto: DrawDoorprizeDto, userId: string): Promise<{
        success: boolean;
        winner: {
            ticketId: string;
            attendeeEmail: string;
            attendeePhone: string;
            prizeName: string;
            id: string;
            doorprizeItemId: string;
            winnerName: string;
            drawnAt: Date;
            drawnBy: string;
        };
    }>;
    listWinners(eventId: string, userId: string): Promise<({
        ticket: {
            orderItem: {
                id: string;
                createdAt: Date;
                facilities: import("@prisma/client/runtime/library").JsonValue | null;
                orderId: string;
                ticketCategoryId: string;
                qty: number;
                unitPrice: number;
                attendeeName: string;
                attendeeEmail: string;
                attendeePhone: string;
                city: string | null;
                customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            qrPayload: string;
            orderItemId: string;
            checkedInAt: Date | null;
            checkedInBy: string | null;
            checkedOutAt: Date | null;
            checkedOutBy: string | null;
            wristbandCode: string | null;
            wristbandPrintedAt: Date | null;
            isBlocked: boolean;
            blockedReason: string | null;
            blockedBy: string | null;
            blockedAt: Date | null;
        };
        doorprizeItem: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            imageUrl: string | null;
            quantity: number;
            remainingQuantity: number;
        };
    } & {
        id: string;
        ticketId: string;
        doorprizeItemId: string;
        winnerName: string;
        drawnAt: Date;
        drawnBy: string;
    })[]>;
}
