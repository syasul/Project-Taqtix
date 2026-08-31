import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ReorderCustomFieldsDto } from './dto/reorder-custom-fields.dto';
export declare class CustomFieldsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    create(eventId: string, dto: CreateCustomFieldDto, userId: string): Promise<{
        order: number;
        required: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        label: string;
        fieldType: string;
        options: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(eventId: string): Promise<{
        order: number;
        required: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        label: string;
        fieldType: string;
        options: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    update(eventId: string, fieldId: string, dto: UpdateCustomFieldDto, userId: string): Promise<{
        order: number;
        required: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        label: string;
        fieldType: string;
        options: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    delete(eventId: string, fieldId: string, userId: string): Promise<{
        order: number;
        required: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        label: string;
        fieldType: string;
        options: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    reorder(eventId: string, dto: ReorderCustomFieldsDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
