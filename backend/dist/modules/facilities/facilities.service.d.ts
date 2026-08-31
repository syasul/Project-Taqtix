import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
export declare class FacilitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    private verifyEventOwnership;
    create(eventId: string, dto: CreateFacilityDto, userId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number | null;
        sold: number;
        applicableTicketCategoryIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(eventId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number | null;
        sold: number;
        applicableTicketCategoryIds: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    update(eventId: string, facilityId: string, dto: UpdateFacilityDto, userId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number | null;
        sold: number;
        applicableTicketCategoryIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    delete(eventId: string, facilityId: string, userId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        eventId: string;
        price: number;
        quota: number | null;
        sold: number;
        applicableTicketCategoryIds: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
