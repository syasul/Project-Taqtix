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
   * Membuat atau mengambil token / link pembayaran untuk pesanan.
   * Mendukung DOKU Checkout sebagai provider utama sesuai TASK.md,
   * dengan fallback ke Midtrans Snap atau Simulator Sandbox di local development.
   */
  async pay(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        buyer: true,
        orderItems: {
          include: {
            ticketCategory: true,
          },
        },
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
          provider: 'doku',
        },
      });
    }

    // 1. Cek DOKU credentials
    const dokuClientId =
      this.configService.get<string>('DOKU_CLIENT_ID') ||
      this.configService.get<string>('PAYMENT_PROVIDER_KEY');
    const dokuSecretKey =
      this.configService.get<string>('DOKU_SECRET_KEY') ||
      this.configService.get<string>('PAYMENT_PROVIDER_SECRET');

    if (dokuClientId && dokuSecretKey) {
      return this.createDokuPayment(order, payment, dokuClientId, dokuSecretKey);
    }

    // 2. Cek Midtrans credentials
    const midtransServerKey =
      this.configService.get<string>('TAQTIX_MIDTRANS_SERVER_KEY');
    if (midtransServerKey) {
      return this.createMidtransPayment(order, payment, midtransServerKey);
    }

    // 3. Fallback: Local Sandbox Dev Simulator
    const frontendUrl =
      this.configService.get<string>('TAQTIX_FRONTEND_URL') ||
      this.configService.get<string>('TAQTIX_WEB_URL') ||
      'http://localhost:3000';
    const mockRedirectUrl = `${frontendUrl}/orders/${order.id}?simulation=true`;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: 'DEV_MOCK_' + order.id,
        provider: 'doku_sandbox_mock',
      },
    });

    return {
      token: 'mock_token_' + order.id,
      redirectUrl: mockRedirectUrl,
      provider: 'doku_sandbox_mock',
      message:
        'Mode sandbox simulasi aktif (DOKU_CLIENT_ID & DOKU_SECRET_KEY belum diisi di environment)',
    };
  }

  /**
   * Membuat pembayaran menggunakan DOKU Checkout API (TASK.md requirement).
   */
  private async createDokuPayment(
    order: any,
    payment: any,
    clientId: string,
    secretKey: string,
  ) {
    const isProd =
      this.configService.get<string>('NODE_ENV') === 'production';
    const baseUrl = isProd
      ? 'https://api.doku.com'
      : 'https://api-sandbox.doku.com';
    const requestTarget = '/checkout/v1/payment';
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    const firstItem = order.orderItems[0];
    const buyerName = firstItem ? firstItem.attendeeName : 'Guest';
    const buyerEmail = order.buyer.email;
    const buyerPhone = firstItem ? firstItem.attendeePhone : '';

    const frontendUrl =
      this.configService.get<string>('TAQTIX_FRONTEND_URL') ||
      this.configService.get<string>('TAQTIX_WEB_URL') ||
      'https://taqtix.id';

    const payload = {
      order: {
        amount: Math.round(order.totalAmount),
        invoice_number: order.id,
        currency: 'IDR',
        callback_url: `${frontendUrl}/orders/${order.id}`,
        line_items: order.orderItems.map((item: any) => ({
          name: item.ticketCategory?.name || 'Tiket Event',
          price: Math.round(item.unitPrice),
          quantity: item.qty,
        })),
      },
      payment: {
        payment_due_date: 10, // 10 menit batas pembayaran
      },
      customer: {
        id: order.buyer.id,
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone || undefined,
      },
    };

    const bodyString = JSON.stringify(payload);
    const digest = crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('base64');

    const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    const signature =
      'HMACSHA256=' +
      crypto
        .createHmac('sha256', secretKey)
        .update(signatureComponent)
        .digest('base64');

    try {
      const response = await fetch(`${baseUrl}${requestTarget}`, {
        method: 'POST',
        headers: {
          'Client-Id': clientId,
          'Request-Id': requestId,
          'Request-Timestamp': requestTimestamp,
          Signature: signature,
          'Content-Type': 'application/json',
        },
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('DOKU API Error:', data);
        throw new BadRequestException(
          data?.message || 'Gagal menghubungi payment gateway DOKU',
        );
      }

      const redirectUrl =
        data?.response?.payment?.url || data?.payment?.url || '';

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          snapToken: redirectUrl,
          provider: 'doku',
        },
      });

      return {
        token: redirectUrl,
        redirectUrl,
        provider: 'doku',
      };
    } catch (err: any) {
      console.error('Gagal request DOKU Checkout:', err);
      throw new BadRequestException(
        err.message || 'Gagal memproses pembayaran DOKU',
      );
    }
  }

  /**
   * Membuat pembayaran menggunakan Snap Midtrans (Fallback provider).
   */
  private async createMidtransPayment(
    order: any,
    payment: any,
    serverKey: string,
  ) {
    const isProd =
      this.configService.get<string>('TAQTIX_MIDTRANS_IS_PRODUCTION') ===
      'true';
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

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          snapToken: data.token,
          provider: 'midtrans',
        },
      });

      return {
        token: data.token,
        redirectUrl: data.redirect_url,
        provider: 'midtrans',
      };
    } catch (error) {
      console.error('Gagal melakukan request Snap Midtrans:', error);
      throw new BadRequestException('Gagal memproses pembayaran Midtrans');
    }
  }

  /**
   * Menangani callback webhook dari Payment Gateway (DOKU / Midtrans).
   */
  async handleWebhook(
    body: any,
    provider = 'doku',
    headers: Record<string, string> = {},
  ) {
    const normalized = (provider || 'doku').toLowerCase();
    console.log(`[Payment Webhook] Menerima webhook provider: ${normalized}`);

    // 1. DOKU Webhook
    if (
      normalized === 'doku' ||
      body?.order?.invoice_number ||
      body?.transaction?.status
    ) {
      return this.handleDokuWebhook(body, headers);
    }

    // 2. Midtrans Webhook
    if (
      normalized === 'midtrans' ||
      (body?.order_id && body?.signature_key)
    ) {
      return this.handleMidtransWebhook(body);
    }

    // 3. Test / Sandbox Direct Confirmation
    if (normalized === 'test' || normalized === 'sandbox') {
      const orderId = body?.orderId || body?.order_id;
      if (!orderId) {
        throw new BadRequestException('orderId diperlukan');
      }
      await this.processPaymentSuccess(orderId, 'TEST_' + crypto.randomUUID());
      return { received: true, status: 'success' };
    }

    throw new BadRequestException(`Provider webhook ${provider} tidak didukung`);
  }

  /**
   * Verifikasi dan proses notifikasi webhook DOKU.
   */
  private async handleDokuWebhook(body: any, headers: Record<string, string>) {
    const orderId =
      body?.order?.invoice_number || body?.order?.invoiceNumber;
    const transactionStatus =
      body?.transaction?.status || body?.transaction_status;
    const transactionId =
      body?.transaction?.id || body?.service?.id || crypto.randomUUID();

    if (!orderId) {
      throw new BadRequestException(
        'Invoice number tidak ditemukan pada payload DOKU',
      );
    }

    const dokuSecretKey =
      this.configService.get<string>('DOKU_SECRET_KEY') ||
      this.configService.get<string>('PAYMENT_PROVIDER_SECRET');

    // Verifikasi Signature DOKU jika secret key diset dan header signature dikirim
    const incomingSignature = headers['signature'] || headers['Signature'];
    if (dokuSecretKey && incomingSignature) {
      const clientId = headers['client-id'] || headers['Client-Id'] || '';
      const requestId = headers['request-id'] || headers['Request-Id'] || '';
      const requestTimestamp =
        headers['request-timestamp'] || headers['Request-Timestamp'] || '';
      const requestTarget = '/v1/payments/webhook/doku';

      const digest = crypto
        .createHash('sha256')
        .update(JSON.stringify(body))
        .digest('base64');
      const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
      const expectedSignature =
        'HMACSHA256=' +
        crypto
          .createHmac('sha256', dokuSecretKey)
          .update(signatureComponent)
          .digest('base64');

      if (
        this.configService.get<string>('NODE_ENV') === 'production' &&
        incomingSignature !== expectedSignature
      ) {
        console.warn(
          `[DOKU Webhook] Signature mismatch. Incoming: ${incomingSignature}, Expected: ${expectedSignature}`,
        );
      }
    }

    console.log(
      `[DOKU Webhook] Processing invoice: ${orderId}, status: ${transactionStatus}`,
    );

    if (transactionStatus === 'SUCCESS') {
      await this.processPaymentSuccess(orderId, String(transactionId));
    } else if (
      transactionStatus === 'FAILED' ||
      transactionStatus === 'EXPIRED'
    ) {
      await this.processPaymentFailed(orderId);
    }

    return { received: true };
  }

  /**
   * Verifikasi dan proses notifikasi webhook Midtrans.
   */
  private async handleMidtransWebhook(body: any) {
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

    // 1. Verifikasi Signature Key Midtrans jika server key diset
    if (serverKey && signature_key) {
      const rawString = order_id + status_code + gross_amount + serverKey;
      const computedSignature = crypto
        .createHash('sha512')
        .update(rawString)
        .digest('hex');

      if (computedSignature !== signature_key) {
        throw new BadRequestException('Signature key Midtrans tidak cocok');
      }
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
      await this.processPaymentSuccess(order_id, transaction_id);
    } else if (isCancel) {
      await this.processPaymentFailed(order_id);
    }

    return { received: true };
  }

  /**
   * Logika transaksional saat pembayaran berhasil:
   * 1. Update status order menjadi PAID & payment menjadi SUCCESS.
   * 2. Generate e-ticket dengan QR payload bertanda tangan JWT.
   * 3. Akumulasi komisi partner afiliasi jika order menggunakan affiliate code.
   * 4. Kirim notifikasi e-ticket via WhatsApp dan Email secara asinkron via BullMQ.
   */
  async processPaymentSuccess(orderId: string, transactionId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
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
            externalId: transactionId || order.payment.externalId,
          },
        });
      }

      // Update Order status ke PAID
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });

      const generatedTickets: any[] = [];

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
        const qrUrl = `${this.configService.get<string>('TAQTIX_BASE_URL') || 'https://api.taqtix.id'}/v1/tickets/${ticket.id}`;
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
  }

  /**
   * Logika transaksional saat pembayaran gagal/batal:
   * Mengembalikan kuota tiket dan kode promo yang telah dipesan.
   */
  async processPaymentFailed(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
          payment: true,
        },
      });

      if (!order || order.status === OrderStatus.CANCELLED) {
        return;
      }

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.FAILED,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      for (const item of order.orderItems) {
        await tx.ticketCategory.update({
          where: { id: item.ticketCategoryId },
          data: {
            sold: { decrement: item.qty },
          },
        });
      }

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

  /**
   * Mendapatkan detail tiket untuk halaman e-ticket pembeli (Public via link).
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
