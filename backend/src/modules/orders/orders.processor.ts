import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Processor('order-expiration')
export class OrdersProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('expire-order')
  async handleExpireOrder(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;
    console.log(`[BullMQ] Memproses kedaluwarsa pesanan: ${orderId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: true,
          },
        });

        if (!order) {
          console.warn(`[BullMQ] Pesanan ${orderId} tidak ditemukan.`);
          return;
        }

        // Jika status pesanan bukan PENDING, abaikan pembatalan
        if (order.status !== OrderStatus.PENDING) {
          console.log(
            `[BullMQ] Pesanan ${orderId} dilewati karena berstatus ${order.status}.`,
          );
          return;
        }

        // Update status order menjadi CANCELLED
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        // Kembalikan kuota masing-masing kategori tiket
        for (const item of order.orderItems) {
          await tx.ticketCategory.update({
            where: { id: item.ticketCategoryId },
            data: {
              sold: { decrement: item.qty },
            },
          });
        }

        // Kembalikan limit penggunaan kode promo jika terisi
        if (order.promoCodeId) {
          await tx.promoCode.update({
            where: { id: order.promoCodeId },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }

        console.log(
          `[BullMQ] Pesanan ${orderId} berhasil dibatalkan otomatis dan kuota dikembalikan.`,
        );
      });
    } catch (error) {
      console.error(`[BullMQ] Gagal membatalkan pesanan ${orderId}:`, error);
      throw error;
    }
  }
}
