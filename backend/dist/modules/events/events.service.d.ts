import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    create(dto: CreateEventDto, userId: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    }>;
    update(id: string, dto: UpdateEventDto, userId: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    }>;
    publish(id: string, userId: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    }>;
    findAllPublic(): Promise<({
        organizer: {
            name: string;
            slug: string;
        };
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    })[]>;
    findOnePublicBySlug(slug: string): Promise<{
        organizer: {
            name: string;
            slug: string;
        };
        ticketCategories: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            price: number;
            quota: number;
            eventId: string;
            sold: number;
            maxPerOrder: number;
            saleStartAt: Date;
            saleEndAt: Date;
        }[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    }>;
    findAllOrganizerEvents(userId: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
    }[]>;
}
