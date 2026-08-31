import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreatePosTransactionDto } from './dto/create-pos-transaction.dto';
export declare class PosService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    private generateQrPayload;
    createTransaction(eventId: string, dto: CreatePosTransactionDto, cashierUserId: string): Promise<{
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
