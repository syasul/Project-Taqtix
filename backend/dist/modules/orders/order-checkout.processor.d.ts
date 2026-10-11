import { Job } from 'bullmq';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrderCheckoutProcessor {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    handleProcessCheckout(job: Job<{
        queueId: string;
        dto: CreateOrderDto;
        authenticatedUserId?: string;
        idempotencyKey?: string;
    }>): Promise<{
        orderId: any;
        paymentUrl: any;
        totalAmount: any;
    }>;
}
