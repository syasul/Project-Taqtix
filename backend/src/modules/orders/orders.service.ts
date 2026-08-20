import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('order-expiration') private orderExpirationQueue: Queue,
  ) {}

  /**
   * Membuat pesanan baru dengan locking kuota tiket pesanan secara transaksional (SELECT FOR UPDATE).
   */
  async create(dto: CreateOrderDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let discountAmt = 0;
      let promoCodeId: string | undefined = undefined;
      let affiliatePartnerId: string | undefined = undefined;

      // 0. Dapatkan atau buat user pembeli
      let buyer = await tx.user.findUnique({
        where: { email: dto.buyerEmail },
      });
      if (!buyer) {
        buyer = await tx.user.create({
          data: {
            email: dto.buyerEmail,
            passwordHash: '', // guest/unauthenticated
            role: 'buyer',
          },
        });
      }

      // 1. Validasi Promo Code jika ada
      if (dto.promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: dto.promoCode },
        });

        if (!promo || promo.eventId !== dto.eventId) {
          throw new HttpException(
            { code: 'INVALID_PROMO_CODE', message: 'Kode promo tidak valid untuk event ini' },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        if (promo.usedCount >= promo.maxUsage) {
          throw new HttpException(
            { code: 'INVALID_PROMO_CODE', message: 'Kuota penggunaan kode promo sudah habis' },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        promoCodeId = promo.id;
      }

      // 2. Validasi Affiliate Code jika ada
      if (dto.affiliateCode) {
        const affiliate = await tx.partner.findUnique({
          where: { uniqueCode: dto.affiliateCode },
        });

        if (affiliate && affiliate.eventId === dto.eventId) {
          affiliatePartnerId = affiliate.id;
        }
      }

      // 3. Lock dan validasi kuota tiket
      let basePriceTotal = 0;
      const verifiedItems: { ticketCategoryId: string; qty: number; price: number }[] = [];

      for (const item of dto.items) {
        // Lakukan pessimistic locking pada baris TicketCategory
        const ticketCategories = await tx.$queryRaw<any[]>`
          SELECT id, quota, sold, name, price FROM "TicketCategory"
          WHERE id = ${item.ticketCategoryId} AND "eventId" = ${dto.eventId}
          FOR UPDATE
        `;

        if (!ticketCategories || ticketCategories.length === 0) {
          throw new BadRequestException(`Kategori tiket ${item.ticketCategoryId} tidak ditemukan pada event ini`);
        }

        const ticketCategory = ticketCategories[0];
        const remaining = ticketCategory.quota - ticketCategory.sold;

        if (remaining < item.qty) {
          throw new HttpException(
            {
              code: 'TICKET_SOLD_OUT',
              message: `Kuota tiket kategori "${ticketCategory.name}" tidak mencukupi. Tersisa: ${remaining}, diminta: ${item.qty}`,
            },
            HttpStatus.CONFLICT,
          );
        }

        // Increment sold
        await tx.ticketCategory.update({
          where: { id: ticketCategory.id },
          data: {
            sold: { increment: item.qty },
          },
        });

        const itemTotal = ticketCategory.price * item.qty;
        basePriceTotal += itemTotal;

        verifiedItems.push({
          ticketCategoryId: ticketCategory.id,
          qty: item.qty,
          price: ticketCategory.price,
        });
      }

      // 4. Kalkulasi diskon promo code
      if (dto.promoCode && promoCodeId) {
        const promo = await tx.promoCode.findUnique({
          where: { id: promoCodeId },
        });
        if (promo) {
          if (promo.discount <= 100) {
            // Diskon persentase
            discountAmt = basePriceTotal * (promo.discount / 100);
          } else {
            // Diskon nominal flat
            discountAmt = promo.discount;
          }
          // Diskon tidak boleh melebihi harga total dasar
          discountAmt = Math.min(discountAmt, basePriceTotal);

          // Update kuota terpakai promo code
          await tx.promoCode.update({
            where: { id: promo.id },
            data: {
              usedCount: { increment: 1 },
            },
          });
        }
      }

      const totalAmount = basePriceTotal - discountAmt;
      const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

      // 5. Buat Order
      const newOrder = await tx.order.create({
        data: {
          buyerId: buyer.id,
          eventId: dto.eventId,
          totalAmount,
          discountAmount: discountAmt,
          status: OrderStatus.PENDING,
          promoCodeId,
          partnerId: affiliatePartnerId,
          expiredAt,
        },
      });

      // 6. Buat OrderItems
      for (const item of verifiedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ticketCategoryId: item.ticketCategoryId,
            qty: item.qty,
            unitPrice: item.price,
            attendeeName: dto.buyerName,
            attendeeEmail: dto.buyerEmail,
            attendeePhone: dto.buyerPhone || '',
          },
        });
      }

      return newOrder;
    });

    // 7. Jadwalkan pembatalan otomatis dalam 15 menit menggunakan BullMQ
    await this.orderExpirationQueue.add(
      'expire-order',
      { orderId: order.id },
      { delay: 15 * 60 * 1000 }, // 15 menit
    );

    return order;
  }

  /**
   * Mengambil detail status pesanan berdasarkan ID.
   */
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            ticketCategory: true,
          },
        },
        event: true,
        payment: true,
        buyer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    return order;
  }
}
