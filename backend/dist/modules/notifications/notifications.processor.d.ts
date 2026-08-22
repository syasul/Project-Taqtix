import { Job } from 'bullmq';
interface NotificationPayload {
    ticketId: string;
    buyerName: string;
    eventTitle: string;
    ticketCategory: string;
    qrUrl: string;
    phone?: string;
    email?: string;
}
export declare class NotificationsProcessor {
    handleSendTicketWhatsapp(job: Job<NotificationPayload>): Promise<void>;
    handleSendTicketEmail(job: Job<NotificationPayload>): Promise<void>;
}
export {};
