import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class CRMService {
    private readonly prisma;
    private readonly broadcastQueue;
    constructor(prisma: PrismaService, broadcastQueue: Queue);
    createSegment(eventId: string, name: string, criteria: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findSegments(eventId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findSegment(segmentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getSegmentMembers(segmentId: string): Promise<{
        name: any;
        email: any;
        phone: any;
        city: any;
        qty: any;
        categories: unknown[];
    }[]>;
    createBroadcast(segmentId: string, message: string, channel?: 'whatsapp' | 'email', subject?: string): Promise<{
        jobId: string;
        targetCount: number;
        status: string;
        channel?: undefined;
    } | {
        jobId: string;
        channel: "email" | "whatsapp";
        targetCount: number;
        status: string;
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
