import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    payOrder(orderId: string): Promise<{
        token: any;
        redirectUrl: any;
    }>;
    handleWebhook(provider: string, body: any): Promise<{
        received: boolean;
    }>;
    getPaymentStatus(orderId: string): Promise<{
        status: string;
    }>;
}
