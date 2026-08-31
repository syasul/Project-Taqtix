import { PosService } from './pos.service';
import { CreatePosTransactionDto } from './dto/create-pos-transaction.dto';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    createTransaction(eventId: string, dto: CreatePosTransactionDto, userId: string): Promise<{
        success: boolean;
        posTransaction: {
            items: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            createdAt: Date;
            eventId: string;
            totalAmount: number;
            buyerName: string | null;
            buyerPhone: string | null;
            paymentMethod: string;
            cashierId: string;
        };
        tickets: any[];
    }>;
    listTransactions(eventId: string, userId: string): Promise<{
        items: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        createdAt: Date;
        eventId: string;
        totalAmount: number;
        buyerName: string | null;
        buyerPhone: string | null;
        paymentMethod: string;
        cashierId: string;
    }[]>;
    getSummary(eventId: string, userId: string): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        byPaymentMethod: {
            cash: number;
            qris: number;
            debit: number;
        };
    }>;
}
