import { RundownService } from './rundown.service';
import { CreateRundownDto } from './dto/create-rundown.dto';
import { UpdateRundownDto } from './dto/update-rundown.dto';
import { ReorderRundownDto } from './dto/reorder-rundown.dto';
export declare class RundownController {
    private readonly rundownService;
    constructor(rundownService: RundownService);
    create(eventId: string, dto: CreateRundownDto, userId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            order: number;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            timeRange: string;
            isHighlight: boolean;
        };
    }>;
    findAll(eventId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            order: number;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            timeRange: string;
            isHighlight: boolean;
        }[];
    }>;
    reorder(eventId: string, dto: ReorderRundownDto, userId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            order: number;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            timeRange: string;
            isHighlight: boolean;
        }[];
    }>;
    update(eventId: string, itemId: string, dto: UpdateRundownDto, userId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            order: number;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            timeRange: string;
            isHighlight: boolean;
        };
    }>;
    delete(eventId: string, itemId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
