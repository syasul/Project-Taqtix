import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Queue } from 'bullmq';
export declare class OrdersService {
    private prisma;
    private orderExpirationQueue;
    constructor(prisma: PrismaService, orderExpirationQueue: Queue);
    create(dto: CreateOrderDto): Promise<{
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
    findOne(id: string): Promise<{
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
