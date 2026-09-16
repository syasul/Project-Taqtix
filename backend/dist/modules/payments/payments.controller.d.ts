import { PaymentsService } from './payments.service';
import type { Request } from 'express';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    payOrder(orderId: string): Promise<{
        token: any;
        redirectUrl: any;
        provider: string;
    } | {
        token: string;
        redirectUrl: string;
        provider: string;
        message: string;
    }>;
    handleWebhook(provider: string, body: any, headers: Record<string, string>, req: Request & {
        rawBody?: Buffer;
    }): Promise<{
        received: boolean;
    }>;
    getPaymentStatus(orderId: string): Promise<{
        status: string;
        expiredAt: Date;
    }>;
    checkGatewayStatus(invoiceNumber: string): Promise<import("./doku/doku.service").DokuCheckStatusResult | {
        success: boolean;
        transactionStatus: string;
        data: any;
    }>;
}
