import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(dto: CreateOrderDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        promoCodeId: string | null;
        partnerId: string | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        expiredAt: Date;
    }>;
    getOrder(id: string): Promise<{
        event: {
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
        };
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
        buyer: {
            email: string;
            role: string;
            id: string;
            passwordHash: string;
            activeDeviceId: string | null;
            lastLoginAt: Date | null;
            lastLogoutAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
            orderId: string;
            ticketCategoryId: string;
            qty: number;
            unitPrice: number;
            attendeeName: string;
            attendeeEmail: string;
            attendeePhone: string;
            city: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        promoCodeId: string | null;
        partnerId: string | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        expiredAt: Date;
    }>;
}
