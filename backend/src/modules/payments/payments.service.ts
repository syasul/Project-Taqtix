import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { OrderStatus, PaymentStatus, TicketStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  /**
   * Membuat atau mengambil token pembayaran Snap Midtrans untuk pesanan.
   */
  async pay(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        buyer: true,
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Pesanan ini sudah diproses atau dibatalkan',
      );
    }

    // Ambil atau buat record Payment
    let payment = order.payment;
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          status: PaymentStatus.PENDING,
        },
      });
    }

    const serverKey = this.configService.get<string>(
      'TAQTIX_MIDTRANS_SERVER_KEY',
    );
    const isProd =
      this.configService.get<string>('TAQTIX_MIDTRANS_IS_PRODUCTION') ===
      'true';

    if (!serverKey) {
      throw new Error('Midtrans Server Key belum dikonfigurasi di environment');
    }

    const authHeader =
      'Basic ' + Buffer.from(serverKey + ':').toString('base64');
    const url = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const firstItem = order.orderItems[0];
    const buyerName = firstItem ? firstItem.attendeeName : 'Guest';
    const buyerEmail = order.buyer.email;
    const buyerPhone = firstItem ? firstItem.attendeePhone : '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: order.id,
            gross_amount: order.totalAmount,
          },
          customer_details: {
            first_name: buyerName,
            email: buyerEmail,
            phone: buyerPhone || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Midtrans API Error:', data);
        throw new BadRequestException('Gagal menghubungi layanan pembayaran');
      }

      // Simpan Snap Token di database
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          snapToken: data.token,
        },
      });

      return {
        token: data.token,
        redirectUrl: data.redirect_url,
      };
    } catch (error) {
      console.error('Gagal melakukan request Snap Midtrans:', error);
      throw new BadRequestException('Gagal memproses pembayaran');
    }
  }

  /**
   * Menangani callback webhook dari Midtrans.
   */
  async handleWebhook(body: any) {
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code,
      transaction_id,
    } = body;

    const serverKey =
      this.configService.get<string>('TAQTIX_MIDTRANS_SERVER_KEY') || '';

    // 1. Verifikasi Signature Key Midtrans
    const rawString = order_id + status_code + gross_amount + serverKey;
    const computedSignature = crypto
      .createHash('sha512')
      .update(rawString)
      .digest('hex');

    if (computedSignature !== signature_key) {
      throw new BadRequestException('Signature key tidak cocok');
    }

    console.log(
      `[Midtrans Webhook] Verifikasi sukses untuk Order ID: ${order_id}, Status: ${transaction_status}`,
    );

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const isCancel =
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire';

    if (isSuccess) {
      // Jalankan pemrosesan sukses transaksi secara aman
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: order_id },
          include: {
            orderItems: {
              include: {
                ticketCategory: true,
              },
            },
            payment: true,
            event: true,
            buyer: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Pesanan tidak ditemukan');
        }

        // Jika order sudah PAID, abaikan (idempotent)
        if (order.status === OrderStatus.PAID) {
          return;
        }

        // Update Payment status ke SUCCESS
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              paidAt: new Date(),
              externalId: transaction_id,
            },
          });
        }

        // Update Order status ke PAID
        await tx.order.update({
          where: { id: order_id },
          data: {
            status: OrderStatus.PAID,
          },
        });

        const generatedTickets = [];

        // Generate tiket elektronik & signed payload
        for (const item of order.orderItems) {
          for (let i = 0; i < item.qty; i++) {
            const ticket = await tx.ticket.create({
              data: {
                orderItemId: item.id,
                eventId: order.eventId,
                status: TicketStatus.VALID,
                qrPayload: 'TEMP_' + crypto.randomUUID(),
              },
            });

            // Tandatangani QR payload menggunakan JWT (menggunakan QR secret khusus)
            const expSeconds = Math.floor(order.event.endDate.getTime() / 1000);
            const qrSecret =
              this.configService.get<string>('QR_SIGNING_SECRET') ||
              this.configService.get<string>('QR_SECRET') ||
              'super-secret-qr-key-change-me';
            const signedCode = await this.jwtService.signAsync(
              {
                ticketId: ticket.id,
                eventId: order.eventId,
                type: 'audience',
                exp: expSeconds,
              },
              {
                secret: qrSecret,
              },
            );

            // Update kode tiket dengan token JWT yang telah ditandatangani
            const updatedTicket = await tx.ticket.update({
              where: { id: ticket.id },
              data: { qrPayload: signedCode },
              include: {
                orderItem: {
                  include: {
                    ticketCategory: true,
                  },
                },
              },
            });

            generatedTickets.push(updatedTicket);
          }
        }

        // Hitung akumulasi komisi partner afiliasi jika ada
        if (order.partnerId) {
          const partner = await tx.partner.findUnique({
            where: { id: order.partnerId },
          });

          if (partner) {
            const totalQty = order.orderItems.reduce(
              (acc, item) => acc + item.qty,
              0,
            );
            let calculatedCommission = 0;
            if (partner.commissionType === 'percentage') {
              calculatedCommission =
                order.totalAmount * (partner.commissionValue / 100);
            } else {
              calculatedCommission = partner.commissionValue * totalQty;
            }

            await tx.partner.update({
              where: { id: partner.id },
              data: {
                conversions: { increment: totalQty },
                revenueGenerated: { increment: order.totalAmount },
                commissionEarned: { increment: calculatedCommission },
              },
            });
          }
        }

        // Pemicuan pengiriman e-ticket asinkron via BullMQ
        for (const ticket of generatedTickets) {
          const qrUrl = `${this.configService.get<string>('TAQTIX_BASE_URL') || 'http://localhost:3001'}/api/v1/tickets/${ticket.id}`;
          const attendeePhone = ticket.orderItem.attendeePhone;
          const attendeeName = ticket.orderItem.attendeeName;
          const attendeeEmail = ticket.orderItem.attendeeEmail;

          // Job WhatsApp
          if (attendeePhone) {
            await this.notificationsQueue.add('send-ticket-whatsapp', {
              ticketId: ticket.id,
              phone: attendeePhone,
              buyerName: attendeeName,
              eventTitle: order.event.title,
              ticketCategory: ticket.orderItem.ticketCategory.name,
              qrUrl,
            });
          }

          // Job Email
          await this.notificationsQueue.add('send-ticket-email', {
            ticketId: ticket.id,
            email: attendeeEmail,
            buyerName: attendeeName,
            eventTitle: order.event.title,
            ticketCategory: ticket.orderItem.ticketCategory.name,
            qrUrl,
          });
        }
      });
    } else if (isCancel) {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: order_id },
          include: {
            orderItems: true,
            payment: true,
          },
        });

        if (!order || order.status === OrderStatus.CANCELLED) {
          return;
        }

        // Update Payment status ke FAILED
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: PaymentStatus.FAILED,
            },
          });
        }

        // Update Order status ke CANCELLED
        await tx.order.update({
          where: { id: order_id },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        // Kembalikan kuota tiket
        for (const item of order.orderItems) {
          await tx.ticketCategory.update({
            where: { id: item.ticketCategoryId },
            data: {
              sold: { decrement: item.qty },
            },
          });
        }

        // Kembalikan limit promo
        if (order.promoCodeId) {
          await tx.promoCode.update({
            where: { id: order.promoCodeId },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }
      });
    }

    return { received: true };
  }

  /**
   * Mendapatkan detail tiket untuk halaman e-ticket pembeli.
   */
  async getTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                buyer: true,
              },
            },
            ticketCategory: true,
          },
        },
        event: {
          include: {
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    return {
      ticketId: ticket.id,
      ticketStatus: ticket.status,
      ticketCategory: ticket.orderItem.ticketCategory.name,
      buyerName: ticket.orderItem.attendeeName,
      buyerEmail: ticket.orderItem.attendeeEmail,
      eventTitle: ticket.event.title,
      eventLocation: ticket.event.location,
      eventStartDate: ticket.event.startDate,
      eventEndDate: ticket.event.endDate,
      organizerName: ticket.event.organizer.name,
      signedQrPayload: ticket.qrPayload,
    };
  }

  /**
   * Mendapatkan status pembayaran dari suatu pesanan (Polling).
   */
  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    let status = 'pending';
    if (order.payment) {
      if (order.payment.status === 'SUCCESS') status = 'success';
      else if (order.payment.status === 'FAILED') status = 'failed';
    }
    if (order.status === 'EXPIRED') status = 'expired';

    return { status };
  }
}
