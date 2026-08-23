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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
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
            eventId: string;
            price: number;
            quota: number;
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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
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
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
    }[]>;
}
