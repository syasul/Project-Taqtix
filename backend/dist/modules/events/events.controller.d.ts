import { EventsService } from './events.service';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    getPublicEvents(): Promise<({
        organizer: {
            slug: string;
            name: string;
        };
    } & {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
        allowTicketTransfer: boolean;
        requireLogin: boolean;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
        adminSeoKeywords: string | null;
        seoPriority: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizerId: string;
    })[]>;
    getPublicEventBySlug(slug: string): Promise<{
        customFields: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            eventId: string;
            label: string;
            fieldType: string;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            required: boolean;
        }[];
        organizer: {
            slug: string;
            name: string;
        };
        ticketCategories: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            price: number;
            eventId: string;
            quota: number;
            sold: number;
            maxPerOrder: number;
            saleStartAt: Date;
            saleEndAt: Date;
        }[];
        customFormFields: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            eventId: string;
            label: string;
            fieldType: string;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            required: boolean;
        }[];
        facilities: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            price: number;
            eventId: string;
            quota: number | null;
            sold: number;
            applicableTicketCategoryIds: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        lineup: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            eventId: string;
            photoUrl: string | null;
            performTime: string | null;
            stage: string | null;
        }[];
        id: string;
        title: string;
        slug: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
        allowTicketTransfer: boolean;
        requireLogin: boolean;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
        adminSeoKeywords: string | null;
        seoPriority: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizerId: string;
    }>;
}
