import { CRMService } from './crm.service';
export declare class CRMController {
    private readonly crmService;
    constructor(crmService: CRMService);
    createSegment(eventId: string, name: string, criteria: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    findSegments(eventId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    getSegmentMembers(segmentId: string): Promise<{
        success: boolean;
        data: {
            name: any;
            email: any;
            phone: any;
            city: any;
            qty: any;
            categories: unknown[];
        }[];
    }>;
    createBroadcast(segmentId: string, message: string, channel?: 'whatsapp' | 'email', subject?: string): Promise<{
        success: boolean;
        data: {
            jobId: string;
            targetCount: number;
            status: string;
            channel?: undefined;
        } | {
            jobId: string;
            channel: "email" | "whatsapp";
            targetCount: number;
            status: string;
        };
    }>;
    getBroadcastStatus(jobId: string): Promise<{
        success: boolean;
        data: {
            jobId: string;
            status: string;
            targetCount: number;
            sent: number;
            failed: number;
        };
    }>;
}
