import { TransfersService } from './transfers.service';
import { RequestTransferDto } from './dto/request-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    requestTransfer(ticketId: string, dto: RequestTransferDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        ticketId: string;
        expiresAt: Date;
        toName: string;
        toEmail: string;
        toPhone: string;
        fromEmail: string;
        requestToken: string;
        requestedAt: Date;
        completedAt: Date | null;
    }>;
    confirmTransfer(requestToken: string): Promise<{
        success: boolean;
        message: string;
        transfer: {
            id: string;
            createdAt: Date;
            status: string;
            ticketId: string;
            expiresAt: Date;
            toName: string;
            toEmail: string;
            toPhone: string;
            fromEmail: string;
            requestToken: string;
            requestedAt: Date;
            completedAt: Date | null;
        };
        ticket: {
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
    }>;
    declineTransfer(requestToken: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        ticketId: string;
        expiresAt: Date;
        toName: string;
        toEmail: string;
        toPhone: string;
        fromEmail: string;
        requestToken: string;
        requestedAt: Date;
        completedAt: Date | null;
    }>;
    listEventTransfers(eventId: string): Promise<({
        ticket: {
            orderItem: {
                ticketCategory: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    eventId: string;
                    price: number;
                    quota: number;
                    sold: number;
                    maxPerOrder: number;
                    saleStartAt: Date;
                    saleEndAt: Date;
                };
            } & {
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
    } & {
        id: string;
        createdAt: Date;
        status: string;
        ticketId: string;
        expiresAt: Date;
        toName: string;
        toEmail: string;
        toPhone: string;
        fromEmail: string;
        requestToken: string;
        requestedAt: Date;
        completedAt: Date | null;
    })[]>;
}
