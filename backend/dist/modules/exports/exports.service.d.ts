import { PrismaService } from '../prisma/prisma.service';
export declare class ExportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    exportOrders(eventId: string, userId: string): Promise<{
        filename: string;
        csv: string;
    }>;
    exportAttendance(eventId: string, userId: string): Promise<{
        filename: string;
        csv: string;
    }>;
    exportFinancialSummary(eventId: string, userId: string): Promise<{
        filename: string;
        csv: string;
    }>;
    exportCrossEventSummary(userId: string, from?: string, to?: string): Promise<{
        filename: string;
        csv: string;
    }>;
}
