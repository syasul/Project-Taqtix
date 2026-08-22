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
    }>;
    handleWebhook(body: any): Promise<{
        received: boolean;
    }>;
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
