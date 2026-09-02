import { PrismaService } from '../prisma/prisma.service';
export declare class ApiV1Controller {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getEvents(req: any): Promise<{
        success: boolean;
        organizer: {
            id: any;
            name: any;
        };
        count: number;
        data: ({
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
            requireLogin: boolean;
            organizerId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            geofenceLat: number | null;
            geofenceLng: number | null;
            geofenceRadius: number | null;
            allowTicketTransfer: boolean;
        })[];
    }>;
    getOrders(req: any, eventId?: string): Promise<{
        success: boolean;
        count: number;
        data: ({
            payment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentStatus;
                orderId: string;
                provider: string;
                snapToken: string | null;
                externalId: string | null;
                amount: number;
                paidAt: Date | null;
            } | null;
            orderItems: ({
                ticketCategory: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                facilities: import("@prisma/client/runtime/library").JsonValue | null;
                orderId: string;
                ticketCategoryId: string;
                qty: number;
                unitPrice: number;
                attendeeName: string;
                attendeeEmail: string;
                attendeePhone: string;
                city: string | null;
                customFieldAnswers: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            promoCodeId: string | null;
            buyerId: string;
            totalAmount: number;
            discountAmount: number;
            partnerId: string | null;
            utmSource: string | null;
            utmMedium: string | null;
            utmCampaign: string | null;
            expiredAt: Date;
        })[];
    }>;
    getAttendance(req: any, eventId?: string): Promise<{
        success: boolean;
        count: number;
        data: {
            ticketId: string;
            eventId: string;
            attendeeName: string;
            attendeeEmail: string;
            ticketCategory: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            checkedInAt: Date | null;
            wristbandCode: string | null;
            isBlocked: boolean;
        }[];
    }>;
}
