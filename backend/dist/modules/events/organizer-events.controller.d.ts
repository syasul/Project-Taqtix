import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class OrganizerEventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    getOrganizerEvents(userId: string): Promise<{
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
    createEvent(dto: CreateEventDto, userId: string): Promise<{
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
    updateEvent(id: string, dto: UpdateEventDto, userId: string): Promise<{
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
    publishEvent(id: string, userId: string): Promise<{
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
}
