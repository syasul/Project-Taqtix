import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getOrganizerOrThrow;
    create(dto: CreateEventDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }>;
    update(id: string, dto: UpdateEventDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }>;
    publish(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }>;
    findAllPublic(): Promise<({
        organizer: {
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }>;
    findAllOrganizerEvents(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }[]>;
}
