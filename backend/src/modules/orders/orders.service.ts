import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { DokuService } from '../payments/doku/doku.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private idempotencyStore = new Map<
    string,
    { order: any; expiresAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    @InjectQueue('order-expiration') private orderExpirationQueue: Queue,
    @InjectQueue('order-checkout-queue') private checkoutQueue: Queue,
    private readonly dokuService: DokuService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Membuat pesanan baru dengan locking kuota tiket pesanan secara transaksional (SELECT FOR UPDATE).
   */
  async create(
    dto: CreateOrderDto,
    authenticatedUserId?: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = this.idempotencyStore.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.order;
      }
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: {
        customFormFields: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    // Jika event mewajibkan login, pastikan pemesan sudah terotentikasi
    if (event.requireLogin && !authenticatedUserId) {
      throw new UnauthorizedException(
        'Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu sebelum memesan tiket.',
      );
    }

    // Validasi Custom Form Fields
    if (event.customFormFields && event.customFormFields.length > 0) {
      for (const field of event.customFormFields) {
        const orderAns = dto.customFieldAnswers?.[field.id];
        const itemAnswers = dto.items
          .map((it) => it.customFieldAnswers?.[field.id])
          .filter((a) => a !== undefined && a !== null && a !== '');

        // Validasi Required
        if (field.required) {
          const hasOrderAns =
            orderAns !== undefined && orderAns !== null && orderAns !== '';
          const hasItemAns = itemAnswers.length > 0;
          if (!hasOrderAns && !hasItemAns) {
            throw new BadRequestException({
              code: 'VALIDATION_ERROR',
              message: `Formulir "${field.label}" wajib diisi.`,
              field: field.label,
            });
          }
        }

        // Validasi Dropdown options
        if (
          field.fieldType === 'dropdown' &&
          Array.isArray(field.options) &&
          field.options.length > 0
        ) {
          const validOptions = (field.options as string[]).map((o) =>
            String(o),
          );
          const allAnswers: string[] = [orderAns, ...itemAnswers].filter(
            (a): a is string => typeof a === 'string' && a.trim() !== '',
          );
          for (const ans of allAnswers) {
            if (!validOptions.includes(ans)) {
              throw new BadRequestException({
                code: 'VALIDATION_ERROR',
                message: `Jawaban "${ans}" untuk field "${field.label}" tidak valid. Pilihan yang tersedia: ${validOptions.join(', ')}`,
                field: field.label,
              });
            }
          }
        }
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let discountAmt = 0;
      let promoCodeId: string | undefined = undefined;
      let voucherId: string | undefined = undefined;
      let affiliatePartnerId: string | undefined = undefined;

      // 0. Dapatkan atau buat user pembeli
      let buyer: any = null;
      if (authenticatedUserId) {
        buyer = await tx.user.findUnique({
          where: { id: authenticatedUserId },
        });
      }

      if (!buyer) {
        buyer = await tx.user.findUnique({
          where: { email: dto.buyerEmail },
        });
      }

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
            // Pessimistic row locking pada EventFacility untuk anti-overselling
            const facilitiesLocked = await tx.$queryRaw<any[]>`
              SELECT id, quota, sold, name, price, "applicableTicketCategoryIds" FROM "EventFacility"
              WHERE id = ${fac.facilityId} AND "eventId" = ${dto.eventId}
              FOR UPDATE
            `;

            if (!facilitiesLocked || facilitiesLocked.length === 0) {
              throw new BadRequestException(
                `Fasilitas dengan ID "${fac.facilityId}" tidak ditemukan pada event ini.`,
              );
            }

            const facility = facilitiesLocked[0];

            // Validasi applicableTicketCategoryIds
            let applicableCategories = facility.applicableTicketCategoryIds;
            if (typeof applicableCategories === 'string') {
              try {
                applicableCategories = JSON.parse(applicableCategories);
              } catch {
                applicableCategories = [];
              }
            }

            if (
              Array.isArray(applicableCategories) &&
              applicableCategories.length > 0 &&
              !applicableCategories.includes(item.ticketCategoryId)
            ) {
              throw new BadRequestException({
                code: 'FACILITY_NOT_APPLICABLE',
                message: `Fasilitas "${facility.name}" tidak berlaku untuk kategori tiket "${ticketCategory.name}".`,
              });
            }

            // Validasi kuota fasilitas
            if (
              facility.quota !== null &&
              facility.quota - facility.sold < fac.qty
            ) {
              throw new HttpException(
                {
                  code: 'FACILITY_SOLD_OUT',
                  message: `Kuota fasilitas "${facility.name}" tidak mencukupi (sisa ${facility.quota - facility.sold}, diminta: ${fac.qty}).`,
                },
                HttpStatus.CONFLICT,
              );
            }

            await tx.eventFacility.update({
              where: { id: facility.id },
              data: { sold: { increment: fac.qty } },
            });

            const cost = Number(facility.price) * fac.qty;
            itemFacilityCost += cost;
            verifiedItemFacilities.push({
              facilityId: facility.id,
              name: facility.name,
              qty: fac.qty,
              price: Number(facility.price),
            });
          }
        }

        basePriceTotal += itemFacilityCost;

        verifiedItems.push({
          ticketCategoryId: ticketCategory.id,
          qty: item.qty,
          price: ticketCategory.price,
          customFieldAnswers:
            item.customFieldAnswers || dto.customFieldAnswers || null,
          facilities:
            verifiedItemFacilities.length > 0 ? verifiedItemFacilities : null,
        });
      }

      // 4. Kalkulasi diskon voucher / promo code
      if (voucherId) {
        const voucher = await tx.voucher.findUnique({
          where: { id: voucherId },
        });
        if (voucher) {
          if (voucher.type === 'percentage') {
            discountAmt = (basePriceTotal * voucher.value) / 100;
            if (
              voucher.maxDiscountAmount &&
              discountAmt > voucher.maxDiscountAmount
            ) {
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
        const promo = await tx.promoCode.findUnique({
          where: { id: promoCodeId },
        });
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
      const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit sesuai API_CONTRACT.md

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

    // Query order lengkap beserta buyer dan items untuk pembuatan payment
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        buyer: true,
        orderItems: {
          include: {
            ticketCategory: true,
          },
        },
        payment: true,
      },
    });

    let payment = fullOrder?.payment;
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          status: PaymentStatus.PENDING,
          provider: 'doku',
        },
      });
    }

    const dokuConfig = this.dokuService.getConfig();
    let paymentUrl: string | undefined = undefined;
    let expirationDelay = 10 * 60 * 1000;

    if (dokuConfig.clientId && dokuConfig.secretKey) {
      try {
        const result = await this.dokuService.createPayment(fullOrder, payment);
        paymentUrl = result.paymentUrl;

        // Simpan response.payment.token_id ke Payment.externalId (dan snapToken = paymentUrl)
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            externalId: result.tokenId || result.invoiceNumber,
            snapToken: result.paymentUrl,
            provider: 'doku',
          },
        });

        // Update Order.expiredAt pakai response.payment.expired_date dari Doku (parse format yyyyMMddHHmmss UTC+7),
        // BUKAN hitung now + 10 menit secara terpisah di kode TAQtix — supaya expiry di 2 sistem selalu sinkron persis
        if (result.expiredDate) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { expiredAt: result.expiredDate },
          });
          order.expiredAt = result.expiredDate;
          expirationDelay = Math.max(
            1000,
            result.expiredDate.getTime() - Date.now(),
          );
        }
      } catch (dokuError: any) {
        this.logger.error(
          `Gagal memanggil DokuService.createPayment untuk order ${order.id}:`,
          dokuError,
        );
        // Error handling: kalau request ke Doku gagal (network error, response 4xx/5xx), rollback —
        // kembalikan quota yang sudah di-lock, set Order.status jadi cancelled,
        // JANGAN biarkan Order menggantung pending tanpa paymentUrl yang valid
        await this.rollbackOrder(order.id, dto);
        throw new BadRequestException(
          dokuError?.message ||
            'Gagal memproses pembuatan pembayaran dengan DOKU Checkout',
        );
      }
    } else {
      // Fallback mode development / testing lokal
      const frontendUrl =
        this.configService.get<string>('TAQTIX_FRONTEND_URL') ||
        this.configService.get<string>('TAQTIX_WEB_URL') ||
        'http://localhost:3000';
      paymentUrl = `${frontendUrl}/checkout?orderId=${order.id}&simulation=true`;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: 'DEV_MOCK_' + order.id,
          snapToken: paymentUrl,
          provider: 'doku_sandbox_mock',
        },
      });
    }

    // Return response.payment.url ke FE sebagai bagian dari response POST /orders
    (order as any).paymentUrl = paymentUrl;

    // Simpan ke Idempotency store jika key dikirimkan (berlaku 10 menit)
    if (idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, {
        order,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      // Bersihkan memory cache secara berkala jika melebihi 1000 entri
      if (this.idempotencyStore.size > 1000) {
        const now = Date.now();
        for (const [k, v] of this.idempotencyStore.entries()) {
          if (v.expiresAt <= now) this.idempotencyStore.delete(k);
        }
      }
    }

    // 7. Jadwalkan pembatalan otomatis disinkronkan dengan expired_date
    await this.orderExpirationQueue.add(
      'expire-order',
      { orderId: order.id },
      { delay: expirationDelay },
    );

    return order;
  }

  /**
   * Melakukan rollback transaksional jika integrasi payment gateway DOKU gagal:
   * 1. Mengubah Order.status menjadi CANCELLED
   * 2. Mengubah Payment.status menjadi FAILED jika ada
   * 3. Mengembalikan kuota tiket yang telah di-reserve
   * 4. Mengembalikan kuota fasilitas add-ons jika ada
   * 5. Mengembalikan limit pemakaian voucher / promo code
   */
  private async rollbackOrder(orderId: string, dto: CreateOrderDto) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update Order status
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        });

        // 2. Update Payment status
        const payment = await tx.payment.findUnique({
          where: { orderId },
        });
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        // 3. Kembalikan kuota tiket
        for (const item of dto.items) {
          await tx.ticketCategory.update({
            where: { id: item.ticketCategoryId },
            data: { sold: { decrement: item.qty } },
          });

          // Kembalikan fasilitas jika ada
          if (item.facilities && item.facilities.length > 0) {
            for (const fac of item.facilities) {
              await tx.eventFacility.update({
                where: { id: fac.facilityId },
                data: { sold: { decrement: fac.qty } },
              });
            }
          }
        }

        // 4. Kembalikan promo/voucher jika ada
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });
        if (order?.promoCodeId) {
          await tx.promoCode.update({
            where: { id: order.promoCodeId },
            data: { usedCount: { decrement: 1 } },
          });
        }
        if (dto.promoCode) {
          const voucher = await tx.voucher.findFirst({
            where: { code: dto.promoCode.toUpperCase() },
          });
          if (voucher) {
            await tx.voucher.update({
              where: { id: voucher.id },
              data: { usageCount: { decrement: 1 } },
            });
          }
        }
      });
      this.logger.warn(
        `[OrdersService] Rollback order ${orderId} berhasil dieksekusi.`,
      );
    } catch (rollbackErr) {
      this.logger.error(
        `[OrdersService] Gagal melakukan rollback order ${orderId}:`,
        rollbackErr,
      );
    }
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

  /**
   * Mengambil riwayat pesanan milik pengguna yang sedang login.
   */
  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        buyerId: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            bannerUrl: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        payment: true,
        orderItems: {
          include: {
            ticketCategory: true,
            tickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Memasukkan pesanan ke antrean ruang tunggu Redis (Virtual Waiting Room).
   * Mampu menangani lonjakan jutaan checkout serentak dengan memberikan respon instan (<20ms).
   */
  async enqueueOrder(
    dto: CreateOrderDto,
    authenticatedUserId?: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = this.idempotencyStore.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          status: 'COMPLETED',
          queueId: 'idempotent-cached',
          position: 0,
          data: {
            orderId: cached.order.id,
            paymentUrl: cached.order.paymentUrl || null,
            totalAmount: cached.order.totalAmount,
          },
        };
      }
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      select: { id: true, title: true, requireLogin: true },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.requireLogin && !authenticatedUserId) {
      throw new UnauthorizedException(
        'Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu.',
      );
    }

    const queueId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await this.checkoutQueue.add(
      'process-checkout',
      {
        queueId,
        dto,
        authenticatedUserId,
        idempotencyKey,
      },
      {
        jobId: queueId,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );

    const waitingCount = await this.checkoutQueue.getWaitingCount();

    return {
      status: 'QUEUED',
      queueId,
      position: Math.max(1, waitingCount),
      estimatedWaitSeconds: Math.max(2, Math.ceil(waitingCount / 25)),
      message:
        'Pesanan Anda berhasil masuk ke antrean ruang tunggu resmi TAQtix.',
    };
  }

  /**
   * Mengecek status & posisi antrean ruang tunggu di Redis (BullMQ).
   */
  async getQueueStatus(queueId: string) {
    const job = await this.checkoutQueue.getJob(queueId);
    if (!job) {
      throw new NotFoundException('Antrean tidak ditemukan atau sudah selesai.');
    }

    const state = await job.getState();

    if (state === 'completed') {
      return {
        status: 'COMPLETED',
        queueId,
        position: 0,
        data: job.returnvalue,
      };
    }

    if (state === 'failed') {
      return {
        status: 'FAILED',
        queueId,
        position: 0,
        error: job.failedReason || 'Gagal memproses pesanan di antrean.',
      };
    }

    if (state === 'active') {
      return {
        status: 'PROCESSING',
        queueId,
        position: 1,
        estimatedWaitSeconds: 1,
        message: 'Pesanan Anda sedang diproses oleh worker...',
      };
    }

    // state is 'waiting'
    const waitingJobs = await this.checkoutQueue.getWaiting(0, 50);
    const index = waitingJobs.findIndex((j) => j.id === queueId);
    const position =
      index >= 0
        ? index + 1
        : Math.max(1, await this.checkoutQueue.getWaitingCount());

    return {
      status: 'QUEUED',
      queueId,
      position,
      estimatedWaitSeconds: Math.max(2, Math.ceil(position / 25)),
      message: 'Anda sedang mengantre di ruang tunggu.',
    };
  }
}
