import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
export declare class CRMProcessor {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handleSendWhatsapp(job: Job<{
        recipientId: string;
        message: string;
    }>): Promise<void>;
    handleSendEmail(job: Job<{
        recipientId: string;
        message: string;
        subject?: string;
    }>): Promise<void>;
    private updateMasterJobCounter;
}
