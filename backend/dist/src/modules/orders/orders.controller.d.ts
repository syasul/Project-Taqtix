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
        totalAmount: number;
        discountAmount: number;
        expiredAt: Date;
        buyerId: string;
        promoCodeId: string | null;
        partnerId: string | null;
    }>;
    getOrder(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        eventId: string;
        totalAmount: number;
        discountAmount: number;
        expiredAt: Date;
        buyerId: string;
        promoCodeId: string | null;
        partnerId: string | null;
    }>;
}
