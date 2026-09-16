import { ConfigService } from '@nestjs/config';
import { DokuConfig } from './doku.config';
export interface CreatePaymentResult {
    paymentUrl: string;
    tokenId: string;
    expiredDate: Date | null;
    invoiceNumber: string;
}
export interface DokuCheckStatusResult {
    success: boolean;
    transactionStatus?: string;
    transactionId?: string;
    transactionDate?: string;
    rawData?: any;
    error?: string;
}
export declare class DokuService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    getConfig(): DokuConfig;
    createPayment(order: any, payment: any, customFrontendUrl?: string): Promise<CreatePaymentResult>;
    verifyWebhookSignature(headers: Record<string, string>, rawBody?: Buffer | string, requestPath?: string): boolean;
    checkStatus(invoiceNumber: string): Promise<DokuCheckStatusResult>;
}
