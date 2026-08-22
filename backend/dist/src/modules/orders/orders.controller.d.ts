import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(dto: CreateOrderDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        eventId: string;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        promoCodeId: string | null;
        partnerId: string | null;
        expiredAt: Date;
    }>;
    getOrder(id: string): Promise<{
        event: {
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
            id: string;
            email: string;
            passwordHash: string;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        };
        orderItems: ({
            ticketCategory: {
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        eventId: string;
        buyerId: string;
        totalAmount: number;
        discountAmount: number;
        promoCodeId: string | null;
        partnerId: string | null;
        expiredAt: Date;
    }>;
}
