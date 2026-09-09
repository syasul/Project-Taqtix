import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
export declare class PaymentsService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    private readonly notificationsQueue;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService, notificationsQueue: Queue);
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
    private createDokuPayment;
    private createMidtransPayment;
    handleWebhook(body: any, provider?: string, headers?: Record<string, string>): Promise<{
        received: boolean;
    } | {
        received: boolean;
        status: string;
    }>;
    private handleDokuWebhook;
    private handleMidtransWebhook;
    processPaymentSuccess(orderId: string, transactionId?: string): Promise<void>;
    processPaymentFailed(orderId: string): Promise<void>;
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
    }>;
}
