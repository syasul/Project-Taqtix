import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
      include: {
        customFormFields: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    // Validasi Custom Form Fields yang required
    if (event.customFormFields && event.customFormFields.length > 0) {
      const requiredFields = event.customFormFields.filter((f) => f.required);
      for (const reqField of requiredFields) {
        // Cek apakah ada di level order atau di level items
        const inOrder = dto.customFieldAnswers && dto.customFieldAnswers[reqField.id];
        const inItems = dto.items.some(
          (it) => it.customFieldAnswers && it.customFieldAnswers[reqField.id],
        );
        if (!inOrder && !inItems) {
          throw new BadRequestException(
            `Formulir "${reqField.label}" wajib diisi.`,
          );
        }
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let discountAmt = 0;
      let promoCodeId: string | undefined = undefined;
      let voucherId: string | undefined = undefined;
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

      // 1. Validasi Promo Code / Voucher jika ada
      if (dto.promoCode) {
        const voucher = await tx.voucher.findFirst({
          where: {
            code: dto.promoCode.toUpperCase(),
            organizerId: event.organizerId,
          },
        });

        if (voucher) {
          if (voucher.status !== 'active') {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Voucher sudah tidak aktif atau kedaluwarsa',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          const now = new Date();
          if (now < voucher.validFrom || now > voucher.validUntil) {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Voucher berada di luar periode masa berlaku',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Kuota penggunaan voucher sudah habis',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          if (voucher.eventId && voucher.eventId !== dto.eventId) {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Voucher tidak berlaku untuk event ini',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          voucherId = voucher.id;
        } else {
          // Fallback ke legacy PromoCode
          const promo = await tx.promoCode.findUnique({
            where: { code: dto.promoCode },
          });

          if (!promo || promo.eventId !== dto.eventId) {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Kode voucher/promo tidak valid untuk event ini',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }

          if (promo.usedCount >= promo.maxUsage) {
            throw new HttpException(
              {
                code: 'INVALID_PROMO_CODE',
                message: 'Kuota penggunaan promo sudah habis',
              },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          promoCodeId = promo.id;
        }
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
      const verifiedItems: {
        ticketCategoryId: string;
        qty: number;
        price: number;
        customFieldAnswers?: any;
        facilities?: any;
      }[] = [];

      for (const item of dto.items) {
        // Pessimistic locking pada baris TicketCategory
        const ticketCategories = await tx.$queryRaw<any[]>`
          SELECT id, quota, sold, name, price FROM "TicketCategory"
          WHERE id = ${item.ticketCategoryId} AND "eventId" = ${dto.eventId}
          FOR UPDATE
        `;

        if (!ticketCategories || ticketCategories.length === 0) {
          throw new BadRequestException(
            `Kategori tiket ${item.ticketCategoryId} tidak ditemukan pada event ini`,
          );
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

        await tx.ticketCategory.update({
          where: { id: ticketCategory.id },
          data: {
            sold: { increment: item.qty },
          },
        });

        const itemTotal = ticketCategory.price * item.qty;
        basePriceTotal += itemTotal;

        // Process item facilities if any
        let itemFacilityCost = 0;
        const verifiedItemFacilities: any[] = [];
        if (item.facilities && item.facilities.length > 0) {
          for (const fac of item.facilities) {
            const facility = await tx.eventFacility.findUnique({
              where: { id: fac.facilityId },
            });
            if (facility && facility.eventId === dto.eventId) {
              if (facility.quota !== null && facility.quota - facility.sold < fac.qty) {
                throw new BadRequestException(`Fasilitas "${facility.name}" sudah habis.`);
              }
              await tx.eventFacility.update({
                where: { id: facility.id },
                data: { sold: { increment: fac.qty } },
              });
              const cost = facility.price * fac.qty;
              itemFacilityCost += cost;
              verifiedItemFacilities.push({
                facilityId: facility.id,
                name: facility.name,
                qty: fac.qty,
                price: facility.price,
              });
            }
          }
        }

        basePriceTotal += itemFacilityCost;

        verifiedItems.push({
          ticketCategoryId: ticketCategory.id,
          qty: item.qty,
          price: ticketCategory.price,
          customFieldAnswers: item.customFieldAnswers || dto.customFieldAnswers || null,
          facilities: verifiedItemFacilities.length > 0 ? verifiedItemFacilities : null,
        });
      }

      // 4. Kalkulasi diskon voucher / promo code
      if (voucherId) {
        const voucher = await tx.voucher.findUnique({ where: { id: voucherId } });
        if (voucher) {
          if (voucher.type === 'percentage') {
            discountAmt = (basePriceTotal * voucher.value) / 100;
            if (voucher.maxDiscountAmount && discountAmt > voucher.maxDiscountAmount) {
              discountAmt = voucher.maxDiscountAmount;
            }
          } else {
            discountAmt = voucher.value;
          }
          discountAmt = Math.min(discountAmt, basePriceTotal);

          await tx.voucher.update({
            where: { id: voucher.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      } else if (promoCodeId) {
        const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
        if (promo) {
          if (promo.discount <= 100) {
            discountAmt = basePriceTotal * (promo.discount / 100);
          } else {
            discountAmt = promo.discount;
          }
          discountAmt = Math.min(discountAmt, basePriceTotal);

          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      const totalAmount = Math.max(0, basePriceTotal - discountAmt);
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
          utmSource: dto.utmSource || null,
          utmMedium: dto.utmMedium || null,
          utmCampaign: dto.utmCampaign || null,
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
            city: dto.city || null,
            customFieldAnswers: item.customFieldAnswers,
            facilities: item.facilities,
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
