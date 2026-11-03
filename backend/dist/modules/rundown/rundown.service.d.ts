import { PrismaService } from '../prisma/prisma.service';
import { CreateRundownDto } from './dto/create-rundown.dto';
import { UpdateRundownDto } from './dto/update-rundown.dto';
import { ReorderRundownDto } from './dto/reorder-rundown.dto';
export declare class RundownService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    create(eventId: string, dto: CreateRundownDto, userId: string): Promise<{
        description: string | null;
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        timeRange: string;
        isHighlight: boolean;
    }>;
    findAll(eventId: string): Promise<{
        description: string | null;
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        timeRange: string;
        isHighlight: boolean;
    }[]>;
    update(eventId: string, itemId: string, dto: UpdateRundownDto, userId: string): Promise<{
        description: string | null;
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        timeRange: string;
        isHighlight: boolean;
    }>;
    delete(eventId: string, itemId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    reorder(eventId: string, dto: ReorderRundownDto, userId: string): Promise<{
        description: string | null;
        order: number;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        timeRange: string;
        isHighlight: boolean;
    }[]>;
}
