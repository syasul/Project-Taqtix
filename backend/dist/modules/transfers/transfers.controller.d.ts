import { TransfersService } from './transfers.service';
import { RequestTransferDto } from './dto/request-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    requestTransfer(ticketId: string, dto: RequestTransferDto, user: any): Promise<{
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
            fromUserId: string | null;
            toUserId: string | null;
            requestToken: string;
            requestedAt: Date;
            completedAt: Date | null;
        };
        requestToken: string;
    }>;
    getTransferDetails(requestToken: string): Promise<{
        id: string;
        requestToken: string;
        status: string;
        expiresAt: Date;
        fromEmailMasked: string;
        toName: string;
        toEmail: string;
        toPhone: string;
        fromUserId: string | null;
        event: {
            id: string;
            title: string;
            bannerUrl: string;
            location: string;
            startDate: Date;
            endDate: Date;
            isDateTba: boolean;
            organizerName: string;
        };
        ticketCategory: {
            id: string;
            name: string;
            price: number;
        };
        ticketId: string;
        transferCount: number;
    }>;
    confirmTransfer(requestToken: string, user: any): Promise<{
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
            fromUserId: string | null;
            toUserId: string | null;
            requestToken: string;
            requestedAt: Date;
            completedAt: Date | null;
        };
        ticket: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            eventId: string;
            qrPayload: string;
            orderItemId: string;
            attendeeName: string | null;
            attendeeGender: string | null;
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
            transferCount: number;
            ownerId: string | null;
            transferredAt: Date | null;
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
        fromUserId: string | null;
        toUserId: string | null;
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
                    internetFee: number | null;
                    eventId: string;
                    price: number;
                    quota: number;
                    sold: number;
                    maxPerOrder: number;
                    ticketPerPackage: number;
                    saleStartAt: Date;
                    saleEndAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                internetFee: number;
                facilities: import("@prisma/client/runtime/library").JsonValue | null;
                attendeeName: string;
                orderId: string;
                ticketCategoryId: string;
                qty: number;
                unitPrice: number;
                attendeeEmail: string;
                attendeePhone: string;
                city: string | null;
                customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            eventId: string;
            qrPayload: string;
            orderItemId: string;
            attendeeName: string | null;
            attendeeGender: string | null;
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
            transferCount: number;
            ownerId: string | null;
            transferredAt: Date | null;
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
        fromUserId: string | null;
        toUserId: string | null;
        requestToken: string;
        requestedAt: Date;
        completedAt: Date | null;
    })[]>;
}
