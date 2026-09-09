import { PaymentsService } from './payments.service';
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
    handleWebhook(provider: string, body: any, headers: Record<string, string>): Promise<{
        received: boolean;
    } | {
        received: boolean;
        status: string;
    }>;
    getPaymentStatus(orderId: string): Promise<{
        status: string;
    }>;
}
