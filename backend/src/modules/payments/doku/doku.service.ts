import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { getDokuConfig, DokuConfig } from './doku.config';
import {
  generateSignature,
  verifySignature,
  parseDokuExpiredDate,
} from './doku-signature.util';

export interface CreatePaymentResult {
  paymentUrl: string;
  tokenId: string;
  expiredDate: Date | null;
  invoiceNumber: string;
}

export interface DokuCheckStatusResult {
  success: boolean;
  transactionStatus?: string;
  transactionId?: string;
  transactionDate?: string;
  rawData?: any;
  error?: string;
}

@Injectable()
export class DokuService {
  private readonly logger = new Logger(DokuService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Mengambil konfigurasi DOKU
   */
  getConfig(): DokuConfig {
    return getDokuConfig(this.configService);
  }

  /**
   * Memanggil API DOKU Checkout untuk membuat link pembayaran (Hosted Checkout).
   */
  async createPayment(
    order: any,
    payment: any,
    customFrontendUrl?: string,
  ): Promise<CreatePaymentResult> {
    const { clientId, secretKey, baseUrl } = this.getConfig();

    if (!clientId || !secretKey) {
      throw new BadRequestException(
        'Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi',
      );
    }

    const requestTarget = '/checkout/v1/payment';
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

    const firstItem = order.orderItems?.[0];
    const buyerName =
      firstItem?.attendeeName || order.buyer?.name || 'Customer';
    const buyerEmail = order.buyer?.email || firstItem?.attendeeEmail || '';
    const buyerPhone = firstItem?.attendeePhone || order.buyer?.phone || '';

    let formattedPhone = buyerPhone ? String(buyerPhone).trim() : '';
    if (formattedPhone.startsWith('08')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+62')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const frontendUrl =
      customFrontendUrl ||
      this.configService.get<string>('TAQTIX_FRONTEND_URL') ||
      this.configService.get<string>('TAQTIX_WEB_URL') ||
      'https://taqtix.id';

    const invoiceNumber = `TAQTIX-ORD-${order.id}`;

    const payload = {
      order: {
        amount: Math.round(order.totalAmount),
        invoice_number: invoiceNumber,
        callback_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
        callback_url_cancel: `${frontendUrl}/checkout/cancelled?orderId=${order.id}`,
        auto_redirect: true,
        line_items:
          order.orderItems?.map((item: any) => ({
            name: (item.ticketCategory?.name || 'Tiket Event').substring(0, 50),
            price: Math.round(item.unitPrice),
            quantity: item.qty,
          })) || [],
      },
      payment: {
        payment_due_date: 10, // 10 menit
      },
      customer: {
        id: order.buyerId || order.buyer?.id || order.id,
        name: buyerName,
        email: buyerEmail,
        phone: formattedPhone || undefined,
        country: 'ID',
      },
    };

    // Serialize SEKALI untuk konsistensi Digest dan Body HTTP
    const bodyString = JSON.stringify(payload);
    const signature = generateSignature({
      secretKey,
      clientId,
      requestId,
      timestamp: requestTimestamp,
      requestTarget,
      bodyString,
    });

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
        this.logger.error('DOKU Create Payment Error response:', data);
        throw new BadRequestException(
          data?.message ||
            data?.error?.message ||
            'Gagal menghubungi payment gateway DOKU',
        );
      }

      const paymentUrl =
        data?.response?.payment?.url || data?.payment?.url || '';
      const tokenId =
        data?.response?.payment?.token_id || data?.payment?.token_id || '';
      const expiredDateRaw =
        data?.response?.payment?.expired_date ||
        data?.payment?.expired_date ||
        '';

      const expiredDate = expiredDateRaw
        ? parseDokuExpiredDate(expiredDateRaw)
        : null;

      return {
        paymentUrl,
        tokenId,
        expiredDate,
        invoiceNumber,
      };
    } catch (err: any) {
      this.logger.error('Gagal memproses Create Payment DOKU:', err);
      throw new BadRequestException(
        err.message || 'Gagal memproses pembayaran DOKU',
      );
    }
  }

  /**
   * Memverifikasi signature webhook notifikasi yang masuk dari DOKU.
   */
  verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody?: Buffer | string,
    requestPath?: string,
  ): boolean {
    const {
      clientId: configuredClientId,
      secretKey,
      isProduction,
    } = this.getConfig();

    if (!secretKey) {
      if (isProduction) {
        throw new UnauthorizedException(
          'DOKU Secret Key belum dikonfigurasi di server production',
        );
      }
      return true; // Di dev jika secret key tidak diset
    }

    const incomingSignature =
      headers['signature'] ||
      headers['Signature'] ||
      headers['SIGNATURE'] ||
      '';

    const clientId =
      headers['client-id'] ||
      headers['Client-Id'] ||
      headers['CLIENT-ID'] ||
      configuredClientId;
    const requestId =
      headers['request-id'] ||
      headers['Request-Id'] ||
      headers['REQUEST-ID'] ||
      '';
    const timestamp =
      headers['request-timestamp'] ||
      headers['Request-Timestamp'] ||
      headers['REQUEST-TIMESTAMP'] ||
      '';

    const requestTarget =
      headers['request-target'] ||
      headers['Request-Target'] ||
      (requestPath ? requestPath.split('?')[0] : '/payments/webhook/doku');

    let bodyString = '';
    if (rawBody) {
      bodyString = Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : String(rawBody);
    }

    return verifySignature({
      secretKey,
      clientId,
      requestId,
      timestamp,
      requestTarget,
      bodyString,
      incomingSignature,
    });
  }

  /**
   * Memanggil Check Status API DOKU (GET request tanpa Digest).
   */
  async checkStatus(invoiceNumber: string): Promise<DokuCheckStatusResult> {
    const { clientId, secretKey, baseUrl } = this.getConfig();

    if (!clientId || !secretKey) {
      throw new BadRequestException('Kredensial DOKU belum dikonfigurasi');
    }

    const requestTarget = `/orders/v1/status/${invoiceNumber}`;
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19) + 'Z';

    const signature = generateSignature({
      secretKey,
      clientId,
      requestId,
      timestamp,
      requestTarget,
    });

    try {
      const response = await fetch(`${baseUrl}${requestTarget}`, {
        method: 'GET',
        headers: {
          'Client-Id': clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error('DOKU Check Status Error response:', data);
        return { success: false, rawData: data };
      }

      const transactionStatus = String(
        data?.transaction?.status || data?.status || '',
      ).toUpperCase();
      const transactionId = String(
        data?.transaction?.id || data?.order?.session_id || '',
      );
      const transactionDate = data?.transaction?.date;

      return {
        success: true,
        transactionStatus,
        transactionId,
        transactionDate,
        rawData: data,
      };
    } catch (err: any) {
      this.logger.error('Gagal memanggil DOKU Check Status API:', err);
      return { success: false, error: err.message };
    }
  }
}
