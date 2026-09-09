import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface ExportResult {
    isAsync: boolean;
    filename: string;
    csv: string;
    downloadUrl?: string;
    expiresAt?: Date;
}
export declare class ExportsService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getExportsDirectory;
    private handleCsvResult;
    cleanExpiredExports(): Promise<void>;
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    exportOrders(eventId: string, userId: string): Promise<ExportResult>;
    exportAttendance(eventId: string, userId: string): Promise<ExportResult>;
    exportFinancialSummary(eventId: string, userId: string): Promise<ExportResult>;
    exportCrossEventSummary(userId: string, from?: string, to?: string): Promise<ExportResult>;
}
