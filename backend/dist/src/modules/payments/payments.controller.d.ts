import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    payOrder(orderId: string): Promise<{
        token: any;
        redirectUrl: any;
    }>;
    handleWebhook(body: any): Promise<{
        received: boolean;
    }>;
    getTicket(ticketId: string): Promise<{
        ticketId: string;
        ticketStatus: import("@prisma/client").$Enums.TicketStatus;
        ticketCategory: any;
        buyerName: any;
        buyerEmail: any;
        eventTitle: string | undefined;
        eventLocation: string | undefined;
        eventStartDate: Date | undefined;
        eventEndDate: Date | undefined;
        organizerName: string | undefined;
        signedQrPayload: any;
    }>;
}
