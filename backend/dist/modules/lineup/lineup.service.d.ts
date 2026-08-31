import { PrismaService } from '../prisma/prisma.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';
import { ReorderLineupDto } from './dto/reorder-lineup.dto';
export declare class LineupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    create(eventId: string, dto: CreateLineupDto, userId: string): Promise<{
        order: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        photoUrl: string | null;
        performTime: string | null;
        stage: string | null;
    }>;
    findAll(eventId: string): Promise<{
        order: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        photoUrl: string | null;
        performTime: string | null;
        stage: string | null;
    }[]>;
    update(eventId: string, itemId: string, dto: UpdateLineupDto, userId: string): Promise<{
        order: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        photoUrl: string | null;
        performTime: string | null;
        stage: string | null;
    }>;
    delete(eventId: string, itemId: string, userId: string): Promise<{
        order: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        photoUrl: string | null;
        performTime: string | null;
        stage: string | null;
    }>;
    reorder(eventId: string, dto: ReorderLineupDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
