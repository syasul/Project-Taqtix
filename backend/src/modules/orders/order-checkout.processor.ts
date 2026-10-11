import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Processor('order-checkout-queue')
export class OrderCheckoutProcessor {
  constructor(private readonly ordersService: OrdersService) {}

  @Process({ name: 'process-checkout', concurrency: 10 })
  async handleProcessCheckout(
    job: Job<{
      queueId: string;
      dto: CreateOrderDto;
      authenticatedUserId?: string;
      idempotencyKey?: string;
    }>,
  ) {
    const { dto, authenticatedUserId, idempotencyKey } = job.data;
    try {
      const order = await this.ordersService.create(
        dto,
        authenticatedUserId,
        idempotencyKey,
      );

      return {
        orderId: order.id,
        paymentUrl: order.paymentUrl || null,
        totalAmount: order.totalAmount,
      };
    } catch (err: any) {
      let errMsg = 'Gagal memproses pesanan pada antrean.';
      if (err?.response) {
        if (typeof err.response === 'string') {
          errMsg = err.response;
        } else if (err.response.message) {
          errMsg = Array.isArray(err.response.message)
            ? err.response.message.join(', ')
            : err.response.message;
        }
      } else if (err?.message) {
        errMsg = err.message;
      }
      throw new Error(errMsg);
    }
  }
}
