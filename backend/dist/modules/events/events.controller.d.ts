import { EventsService } from './events.service';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    getPublicEvents(): Promise<({
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
        allowTicketTransfer: boolean;
    })[]>;
    getPublicEventBySlug(slug: string): Promise<{
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
        customFormFields: {
            order: number;
            required: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            label: string;
            fieldType: string;
            options: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        facilities: {
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
        }[];
        lineup: {
            order: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            photoUrl: string | null;
            performTime: string | null;
            stage: string | null;
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
        allowTicketTransfer: boolean;
    }>;
}
