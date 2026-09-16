import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import { DokuService } from './doku/doku.service';
export interface DokuWebhookPayload {
    service?: {
        id?: string;
    };
    transaction?: {
        status?: string;
        date?: string;
        id?: string;
        original_request_id?: string;
    };
    transaction_status?: string;
    order?: {
        invoice_number?: string;
        invoiceNumber?: string;
        amount?: number | string;
    };
}
export interface DokuCheckStatusResponse {
    transaction?: {
        status?: string;
        id?: string;
        date?: string;
    };
    order?: {
        session_id?: string;
    };
    status?: string;
}
export declare class PaymentsService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    private readonly notificationsQueue;
    private readonly dokuService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService, notificationsQueue: Queue, dokuService: DokuService);
    pay(orderId: string): Promise<{
        token: any;
        redirectUrl: any;
        provider: string;
    } | {
        token: string;
        redirectUrl: string;
        provider: string;
        message: string;
    }>;
    getDokuConfig(): {
        clientId: string;
        secretKey: string;
        dokuEnv: string;
        isProduction: boolean;
        baseUrl: string;
    };
    generateDokuSignature(secretKey: string, clientId: string, requestId: string, timestamp: string, requestTarget: string, bodyString?: string): string;
    safeCompareSignatures(sigA: string, sigB: string): boolean;
    parseDokuExpiredDate(rawDateStr: string): Date | null;
    private createDokuPayment;
    private createMidtransPayment;
    handleWebhook(body: any, provider?: string, headers?: Record<string, string>, rawBody?: Buffer | string, requestPath?: string): Promise<{
        received: boolean;
    }>;
    private handleDokuWebhook;
    private handleMidtransWebhook;
    processPaymentSuccess(orderId: string, transactionId?: string, paidAtDate?: Date): Promise<void>;
    processPaymentFailed(orderId: string): Promise<void>;
    processPaymentExpired(orderId: string): Promise<void>;
    checkDokuOrderStatus(invoiceNumber: string): Promise<import("./doku/doku.service").DokuCheckStatusResult | {
        success: boolean;
        transactionStatus: string;
        data: any;
    }>;
    handleScheduledStatusCheck(): Promise<void>;
    getTicket(ticketId: string): Promise<{
        ticketId: string;
        ticketStatus: import("@prisma/client").$Enums.TicketStatus;
        ticketCategory: string;
        buyerName: string;
        buyerEmail: string;
        eventTitle: string;
        eventLocation: string;
        eventStartDate: Date;
        eventEndDate: Date;
        organizerName: string;
        signedQrPayload: string;
    }>;
    getPaymentStatus(orderId: string): Promise<{
        status: string;
        expiredAt: Date;
    }>;
}
