import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { OrderStatus, PaymentStatus, TicketStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { DokuService } from './doku/doku.service';
import {
  generateSignature,
  verifySignature,
  parseDokuExpiredDate,
  safeCompareSignatures,
} from './doku/doku-signature.util';

export interface DokuWebhookPayload {
  service?: { id?: string };
  transaction?: {
    status?: string;
    date?: string;
    id?: string;
    original_request_id?: string;
  };
  transaction_status?: string;
  order?: {
    invoice_number?: string;
    invoiceNumber?: string;
    amount?: number | string;
  };
}

export interface DokuCheckStatusResponse {
  transaction?: {
    status?: string;
    id?: string;
    date?: string;
  };
  order?: {
    session_id?: string;
  };
  status?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly dokuService: DokuService,
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
    const { clientId: dokuClientId, secretKey: dokuSecretKey } =
      this.getDokuConfig();

    if (dokuClientId && dokuSecretKey) {
      return this.createDokuPayment(
        order,
        payment,
        dokuClientId,
        dokuSecretKey,
      );
    }

    // 2. Cek Midtrans credentials
    const midtransServerKey = this.configService.get<string>(
      'TAQTIX_MIDTRANS_SERVER_KEY',
    );
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
   * Helper untuk membaca konfigurasi environment DOKU Payment Gateway.
   */
  getDokuConfig() {
    const clientId =
      this.configService.get<string>('DOKU_CLIENT_ID') ||
      this.configService.get<string>('PAYMENT_PROVIDER_KEY') ||
      '';
    const secretKey =
      this.configService.get<string>('DOKU_SECRET_KEY') ||
      this.configService.get<string>('PAYMENT_PROVIDER_SECRET') ||
      '';
    const isBrnProdKey = clientId.startsWith('BRN-');
    const dokuEnv = (
      this.configService.get<string>('DOKU_ENV') ||
      (this.configService.get<string>('NODE_ENV') === 'production' || isBrnProdKey
        ? 'production'
        : 'sandbox')
    ).toLowerCase();
    const isProduction = dokuEnv === 'production' || isBrnProdKey;
    const baseUrl = isProduction
      ? this.configService.get<string>('DOKU_BASE_URL_PRODUCTION') ||
        'https://api.doku.com'
      : this.configService.get<string>('DOKU_BASE_URL_SANDBOX') ||
        'https://api-sandbox.doku.com';

    return { clientId, secretKey, dokuEnv, isProduction, baseUrl };
  }

  /**
   * Menghasilkan signature HMAC-SHA256 resmi DOKU.
   * Untuk POST dengan body:
   *   1. Digest = Base64(SHA256(rawJSONBodyString))
   *   2. stringToSign = Client-Id:{clientId}\nRequest-Id:{requestId}\nRequest-Timestamp:{timestamp}\nRequest-Target:{path}\nDigest:{digest}
   *   3. Signature = "HMACSHA256=" + Base64(HMAC_SHA256(secretKey, stringToSign))
   * Untuk GET tanpa body:
   *   Baris Digest ditiadakan seluruhnya.
   */
  generateDokuSignature(
    secretKey: string,
    clientId: string,
    requestId: string,
    timestamp: string,
    requestTarget: string,
    bodyString?: string,
  ): string {
    let stringToSign = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}`;

    if (bodyString !== undefined && bodyString !== null && bodyString !== '') {
      const digest = crypto
        .createHash('sha256')
        .update(bodyString)
        .digest('base64');
      stringToSign += `\nDigest:${digest}`;
    }

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('base64');

    return `HMACSHA256=${hmac}`;
  }

  /**
   * Perbandingan signature secara timing-safe untuk menghindari timing attacks.
   */
  safeCompareSignatures(sigA: string, sigB: string): boolean {
    if (!sigA || !sigB) return false;
    const bufA = Buffer.from(sigA);
    const bufB = Buffer.from(sigB);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Mengurai format expired_date DOKU (yyyyMMddHHmmss dalam WIB UTC+7) menjadi JavaScript Date.
   * Contoh: "20260917184542" -> 2026-09-17T18:45:42+07:00
   */
  parseDokuExpiredDate(rawDateStr: string): Date | null {
    if (
      !rawDateStr ||
      typeof rawDateStr !== 'string' ||
      rawDateStr.length !== 14
    ) {
      return null;
    }
    const year = rawDateStr.substring(0, 4);
    const month = rawDateStr.substring(4, 6);
    const day = rawDateStr.substring(6, 8);
    const hour = rawDateStr.substring(8, 10);
    const minute = rawDateStr.substring(10, 12);
    const second = rawDateStr.substring(12, 14);

    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Membuat pembayaran menggunakan DOKU Checkout API (1 endpoint hosted checkout).
   */
  private async createDokuPayment(
    order: any,
    payment: any,
    _clientId: string,
    _secretKey: string,
  ) {
    try {
      const result = await this.dokuService.createPayment(order, payment);

      if (result.expiredDate) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { expiredAt: result.expiredDate },
        });
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          snapToken: result.paymentUrl,
          externalId: result.tokenId || result.invoiceNumber,
          provider: 'doku',
        },
      });

      return {
        token: result.paymentUrl,
        redirectUrl: result.paymentUrl,
        provider: 'doku',
        invoiceNumber: result.invoiceNumber,
      };
    } catch (err: any) {
      this.logger.error('Gagal request DOKU Checkout:', err);
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
    rawBody?: Buffer | string,
    requestPath?: string,
  ) {
    const normalized = (provider || 'doku').toLowerCase();
    console.log(`[Payment Webhook] Menerima webhook provider: ${normalized}`);

    // 1. DOKU Webhook
    if (
      normalized === 'doku' ||
      body?.order?.invoice_number ||
      body?.transaction?.status
    ) {
      return this.handleDokuWebhook(body, headers, rawBody, requestPath);
    }

    // 2. Midtrans Webhook
    if (normalized === 'midtrans' || (body?.order_id && body?.signature_key)) {
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

    throw new BadRequestException(
      `Provider webhook ${provider} tidak didukung`,
    );
  }

  /**
   * Verifikasi dan proses notifikasi webhook DOKU secara aman dan idempotent.
   */
  private async handleDokuWebhook(
    body: DokuWebhookPayload | Record<string, any>,
    headers: Record<string, string>,
    rawBody?: Buffer | string,
    requestPath?: string,
  ) {
    const payload = body as DokuWebhookPayload;
    const rawInvoice =
      payload?.order?.invoice_number || payload?.order?.invoiceNumber;
    const transactionStatus = String(
      payload?.transaction?.status || payload?.transaction_status || '',
    ).toUpperCase();
    const transactionId = String(
      payload?.transaction?.id ||
        payload?.transaction?.original_request_id ||
        payload?.service?.id ||
        crypto.randomUUID(),
    );
    const transactionDateStr = payload?.transaction?.date;

    if (!rawInvoice) {
      throw new BadRequestException(
        'Invoice number tidak ditemukan pada payload DOKU',
      );
    }

    const {
      clientId: configuredClientId,
      secretKey: dokuSecretKey,
      isProduction,
    } = this.getDokuConfig();

    // 1. Verifikasi Signature DOKU
    const isValidSignature = this.dokuService.verifyWebhookSignature(
      headers,
      rawBody,
      requestPath,
    );

    if (!isValidSignature) {
      this.logger.warn(
        `[DOKU Webhook] Security Alert: Invalid signature received from IP or headers! Target: ${requestPath}`,
      );
      throw new UnauthorizedException(
        'Signature verifikasi webhook DOKU tidak valid',
      );
    }

    // 2. Cari Order di Database
    const cleanOrderId = rawInvoice.startsWith('TAQTIX-ORD-')
      ? rawInvoice.replace('TAQTIX-ORD-', '')
      : rawInvoice;

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: cleanOrderId },
          { id: rawInvoice },
          { payment: { externalId: rawInvoice } },
        ],
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      console.warn(
        `[DOKU Webhook] Order tidak ditemukan untuk invoice: ${rawInvoice}`,
      );
      throw new NotFoundException(
        `Order dengan invoice ${rawInvoice} tidak ditemukan`,
      );
    }

    // 3. Cocokkan Nominal (order.amount WAJIB sama dengan Order.totalAmount)
    const incomingAmount = Number(body?.order?.amount);
    if (
      !isNaN(incomingAmount) &&
      Math.round(incomingAmount) !== Math.round(order.totalAmount)
    ) {
      console.error(
        `[DOKU Webhook] Nominal tidak cocok! Incoming: ${incomingAmount}, Expected: ${order.totalAmount}`,
      );
      throw new BadRequestException(
        'Nominal pembayaran tidak sesuai dengan total tagihan order',
      );
    }

    // 4. Idempotensi: jika status order sudah PAID, kembalikan response 200 tanpa proses ulang
    if (order.status === OrderStatus.PAID) {
      console.log(
        `[DOKU Webhook] Order ${order.id} sudah berstatus PAID (Idempotent response).`,
      );
      return { received: true, status: 'already_paid' };
    }

    console.log(
      `[DOKU Webhook] Memproses invoice: ${rawInvoice} (Order: ${order.id}), status: ${transactionStatus}`,
    );

    // 5. Mapping Status DOKU sesuai panduan resmi
    if (transactionStatus === 'SUCCESS') {
      await this.processPaymentSuccess(
        order.id,
        String(transactionId),
        transactionDateStr ? new Date(transactionDateStr) : new Date(),
      );
    } else if (transactionStatus === 'FAILED') {
      // PENTING: DOKU merekomendasikan JANGAN langsung membatalkan Order saat status FAILED,
      // karena pembeli dapat mengganti metode bayar di checkout page.
      // Hanya tandai Payment sebagai FAILED, biarkan Order tetap PENDING sampai expiredAt.
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      console.log(
        `[DOKU Webhook] Payment ${order.id} berstatus FAILED, order tetap PENDING sampai expiredAt.`,
      );
    } else if (transactionStatus === 'EXPIRED') {
      await this.processPaymentExpired(order.id);
    } else if (transactionStatus === 'PENDING') {
      console.log(
        `[DOKU Webhook] Order ${order.id} menunggu pembayaran (PENDING).`,
      );
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
  async processPaymentSuccess(
    orderId: string,
    transactionId?: string,
    paidAtDate?: Date,
  ) {
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
            paidAt: paidAtDate || new Date(),
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

      // Generate tiket elektronik & signed payload (mendukung paket bundling/couple)
      for (const item of order.orderItems) {
        const ticketPerPackage = Number(item.ticketCategory?.ticketPerPackage) || 1;
        const totalTicketsToGenerate = item.qty * ticketPerPackage;

        // Ambil data detail peserta dari customFieldAnswers jika ada paket bundling
        const answersObj: any = item.customFieldAnswers || {};
        const packageAttendees: any[] = Array.isArray(answersObj.attendees) ? answersObj.attendees : [];

        for (let i = 0; i < totalTicketsToGenerate; i++) {
          const attendeeInfo = packageAttendees[i] || {};
          const attendeeName = attendeeInfo.name || item.attendeeName || 'Pengunjung';
          const attendeeGender = attendeeInfo.gender || answersObj.gender || null;

          const ticket = await tx.ticket.create({
            data: {
              orderItemId: item.id,
              eventId: order.eventId,
              status: TicketStatus.VALID,
              attendeeName,
              attendeeGender,
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
        const attendeeName = ticket.attendeeName || ticket.orderItem.attendeeName;
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
   * Logika transaksional saat pembayaran gagal/dibatalkan:
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
   * Logika transaksional saat pembayaran kedaluwarsa (EXPIRED):
   * Mengubah status order dan payment menjadi EXPIRED, serta mengembalikan kuota tiket & kode promo.
   */
  async processPaymentExpired(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
          payment: true,
        },
      });

      if (
        !order ||
        order.status === OrderStatus.EXPIRED ||
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.PAID
      ) {
        return;
      }

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.EXPIRED,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.EXPIRED,
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

      console.log(
        `[DOKU] Order ${orderId} berhasil kedaluwarsa (EXPIRED) dan kuota dikembalikan.`,
      );
    });
  }

  /**
   * Cek status pembayaran langsung ke server DOKU (Fallback jika webhook terhambat).
   * GET https://api[-sandbox].doku.com/orders/v1/status/{invoice_number}
   */
  async checkDokuOrderStatus(invoiceNumber: string) {
    const checkResult = await this.dokuService.checkStatus(invoiceNumber);
    if (!checkResult.success) {
      return checkResult;
    }

    const transactionStatus = String(
      checkResult.transactionStatus || '',
    ).toUpperCase();
    const transactionId = String(checkResult.transactionId || '');
    const transactionDateStr = checkResult.transactionDate;

    const cleanOrderId = invoiceNumber.startsWith('TAQTIX-ORD-')
      ? invoiceNumber.replace('TAQTIX-ORD-', '')
      : invoiceNumber;

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: cleanOrderId },
          { id: invoiceNumber },
          { payment: { externalId: invoiceNumber } },
        ],
      },
    });

    if (order && order.status === OrderStatus.PENDING) {
      if (transactionStatus === 'SUCCESS') {
        await this.processPaymentSuccess(
          order.id,
          transactionId,
          transactionDateStr ? new Date(transactionDateStr) : new Date(),
        );
      } else if (transactionStatus === 'EXPIRED') {
        await this.processPaymentExpired(order.id);
      }
    }

    return {
      success: true,
      transactionStatus,
      data: checkResult.rawData,
    };
  }

  /**
   * FASE V: Fallback scheduled cron job (jalan tiap 3-5 menit).
   * Query semua Order dengan status pending yang expiredAt-nya dalam rentang 15 menit terakhir
   * (baik yang belum lewat maupun baru lewat sedikit).
   */
  @Cron('*/3 * * * *')
  async handleScheduledStatusCheck() {
    const { clientId, secretKey } = this.getDokuConfig();
    if (!clientId || !secretKey) {
      return;
    }

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fifteenMinutesAhead = new Date(now.getTime() + 15 * 60 * 1000);

    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        expiredAt: {
          gte: fifteenMinutesAgo,
          lte: fifteenMinutesAhead,
        },
        payment: {
          provider: 'doku',
        },
      },
      include: {
        payment: true,
      },
    });

    for (const order of pendingOrders) {
      const invoiceNumber = `TAQTIX-ORD-${order.id}`;
      try {
        await this.checkDokuOrderStatus(invoiceNumber);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Gagal fallback check status untuk order ${order.id}: ${errorMsg}`,
        );
      }
    }
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
   * Mendukung fallback pengecekan langsung ke gateway DOKU jika order masih PENDING.
   */
  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    // Fallback cek status ke DOKU jika order masih PENDING dan memiliki externalId/invoice
    if (
      order.status === OrderStatus.PENDING &&
      order.payment?.provider === 'doku' &&
      order.payment?.externalId
    ) {
      const { clientId, secretKey } = this.getDokuConfig();
      if (clientId && secretKey) {
        try {
          await this.checkDokuOrderStatus(order.payment.externalId);
          // Ambil state terkini setelah sinkronisasi
          const refreshed = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
          });
          if (refreshed) {
            let status = 'pending';
            if (refreshed.status === OrderStatus.PAID) status = 'success';
            else if (refreshed.status === OrderStatus.EXPIRED)
              status = 'expired';
            else if (refreshed.payment?.status === PaymentStatus.FAILED)
              status = 'failed';
            return { status, expiredAt: refreshed.expiredAt };
          }
        } catch {
          // Tetap lanjutkan dengan status yang ada jika request fallback gagal
        }
      }
    }

    let status = 'pending';
    if (order.payment) {
      if (
        order.payment.status === PaymentStatus.SUCCESS ||
        order.status === OrderStatus.PAID
      )
        status = 'success';
      else if (order.payment.status === PaymentStatus.FAILED) status = 'failed';
    }
    if (order.status === OrderStatus.EXPIRED) status = 'expired';

    return { status, expiredAt: order.expiredAt };
  }
}
