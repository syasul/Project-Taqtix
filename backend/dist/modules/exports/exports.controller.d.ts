import type { Response } from 'express';
import { ExportsService } from './exports.service';
export declare class ExportsController {
    private readonly exportsService;
    constructor(exportsService: ExportsService);
    exportCrossEventSummary(from: string, to: string, format: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    exportOrders(eventId: string, format: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    exportAttendance(eventId: string, format: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    exportFinancialSummary(eventId: string, format: string, userId: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
