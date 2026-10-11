import { CashService } from './cash.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
export declare class CashController {
    private readonly cashService;
    constructor(cashService: CashService);
    getOrganizerCashSummary(userId: string): Promise<{
        grandTotalCash: number;
        totalEvents: number;
        events: {
            eventId: string;
            eventTitle: string;
            status: import("@prisma/client").$Enums.EventStatus;
            startDate: Date;
            transactionCount: number;
            totalCash: number;
        }[];
    }>;
    recordCash(eventId: string, dto: CreateCashTransactionDto, userId: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        eventId: string;
        amount: number;
        relatedOrderId: string | null;
        relatedPosTransactionId: string | null;
        note: string | null;
        recordedBy: string;
    }>;
    getEventCash(eventId: string, userId: string): Promise<{
        data: {
            type: string;
            id: string;
            createdAt: Date;
            eventId: string;
            amount: number;
            relatedOrderId: string | null;
            relatedPosTransactionId: string | null;
            note: string | null;
            recordedBy: string;
        }[];
        meta: {
            totalCashIn: number;
            breakdown: {
                ticket_sale: number;
                merchandise_sale: number;
                facility_sale: number;
                other: number;
            };
            totalCount: number;
        };
    }>;
}
