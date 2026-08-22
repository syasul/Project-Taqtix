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
}
