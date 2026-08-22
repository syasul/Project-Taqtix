import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersProcessor {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handleExpireOrder(job: Job<{
        orderId: string;
    }>): Promise<void>;
}
