import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { DokuService } from './doku/doku.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bull';
import { OrderStatus, PaymentStatus, TicketStatus } from '@prisma/client';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsService - DOKU Integration', () => {
  let service: PaymentsService;
  let prisma: any;
  let configService: any;
  let jwtService: any;
  let queue: any;

  const mockSecretKey = 'sk_test_mock_secret_key_12345';
  const mockClientId = 'BRN-0283-1788009869793';

  const mockPrisma: any = {
    $transaction: jest.fn((callback: (tx: any) => any) => callback(mockPrisma)),
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      update: jest.fn(),
    },
    ticketCategory: {
      update: jest.fn(),
    },
    promoCode: {
      update: jest.fn(),
    },
    partner: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfig = {
    DOKU_CLIENT_ID: mockClientId,
    DOKU_SECRET_KEY: mockSecretKey,
    DOKU_ENV: 'sandbox',
    DOKU_BASE_URL_SANDBOX: 'https://api-sandbox.doku.com',
    QR_SIGNING_SECRET: 'test-qr-secret',
    TAQTIX_BASE_URL: 'https://api.taqtix.id',
    TAQTIX_FRONTEND_URL: 'https://taqtix.id',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        DokuService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getQueueToken('notifications'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);
    jwtService = module.get(JwtService);
    queue = module.get(getQueueToken('notifications'));

    jest.clearAllMocks();
  });

  describe('generateDokuSignature', () => {
    it('harus menghasilkan signature HMAC-SHA256 yang benar untuk POST request dengan body', () => {
      const requestId = 'req-uuid-1234';
      const timestamp = '2026-09-17T08:45:42Z';
      const target = '/checkout/v1/payment';
      const body = JSON.stringify({
        amount: 150000,
        invoice_number: 'TAQTIX-ORD-1',
      });

      // Hitung manual sesuai formula dokumentasi DOKU
      const digest = crypto.createHash('sha256').update(body).digest('base64');
      const stringToSign = `Client-Id:${mockClientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}\nDigest:${digest}`;
      const expectedHmac = crypto
        .createHmac('sha256', mockSecretKey)
        .update(stringToSign)
        .digest('base64');
      const expectedSignature = `HMACSHA256=${expectedHmac}`;

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        body,
      );

      expect(signature).toBe(expectedSignature);
      expect(signature.startsWith('HMACSHA256=')).toBe(true);
    });

    it('harus menghasilkan signature tanpa baris Digest untuk GET request (tanpa body)', () => {
      const requestId = 'req-uuid-5678';
      const timestamp = '2026-09-17T08:50:00Z';
      const target = '/orders/v1/status/TAQTIX-ORD-1';

      const stringToSign = `Client-Id:${mockClientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}`;
      const expectedHmac = crypto
        .createHmac('sha256', mockSecretKey)
        .update(stringToSign)
        .digest('base64');
      const expectedSignature = `HMACSHA256=${expectedHmac}`;

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
      );

      expect(signature).toBe(expectedSignature);
    });
  });

  describe('parseDokuExpiredDate', () => {
    it('harus mengurai format yyyyMMddHHmmss dalam WIB UTC+7 menjadi Date yang valid', () => {
      const rawDate = '20260917184542';
      const date = service.parseDokuExpiredDate(rawDate);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(8); // 0-indexed: 8 = September
      expect(date?.getDate()).toBe(17);
      // WIB 18:45:42 UTC+7 -> 11:45:42 UTC
      expect(date?.toISOString()).toBe('2026-09-17T11:45:42.000Z');
    });

    it('harus mengembalikan null untuk string tanggal yang tidak valid atau salah panjang', () => {
      expect(service.parseDokuExpiredDate('')).toBeNull();
      expect(service.parseDokuExpiredDate('20260917')).toBeNull();
      expect(service.parseDokuExpiredDate('invalid-date-string')).toBeNull();
    });
  });

  describe('handleDokuWebhook', () => {
    const orderId = 'order-uuid-abc-123';
    const invoiceNumber = `TAQTIX-ORD-${orderId}`;
    const amount = 150000;

    const mockOrder = {
      id: orderId,
      totalAmount: amount,
      status: OrderStatus.PENDING,
      eventId: 'event-uuid-1',
      buyerId: 'user-uuid-1',
      payment: {
        id: 'payment-uuid-1',
        status: PaymentStatus.PENDING,
        externalId: invoiceNumber,
      },
      orderItems: [
        {
          id: 'item-1',
          qty: 1,
          ticketCategoryId: 'cat-1',
          attendeeName: 'Budi Santoso',
          attendeeEmail: 'budi@example.com',
          attendeePhone: '08123456789',
          ticketCategory: { name: 'VIP Ticket' },
        },
      ],
      event: {
        id: 'event-uuid-1',
        title: 'Konser Musik TAQtix',
        endDate: new Date('2026-10-01T23:59:59Z'),
      },
      buyer: {
        id: 'user-uuid-1',
        name: 'Budi',
        email: 'budi@example.com',
      },
    };

    it('harus sukses memproses webhook SUCCESS dan mengupdate order ke PAID serta menerbitkan tiket', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.ticket.create.mockResolvedValue({ id: 'ticket-1' });
      mockPrisma.ticket.update.mockResolvedValue({
        id: 'ticket-1',
        qrPayload: 'signed-code',
        orderItem: mockOrder.orderItems[0],
      });

      const body = {
        service: { id: 'VIRTUAL_ACCOUNT' },
        transaction: {
          status: 'SUCCESS',
          date: '2026-09-17T08:50:23Z',
          id: 'TRX-12345',
        },
        order: {
          invoice_number: invoiceNumber,
          amount: 150000,
        },
      };
      const rawBody = JSON.stringify(body);
      const requestId = 'webhook-req-1';
      const timestamp = '2026-09-17T08:50:25Z';
      const target = '/payments/webhook/doku';

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        rawBody,
      );

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature: signature,
      };

      const result = await service.handleWebhook(
        body,
        'doku',
        headers,
        rawBody,
        target,
      );

      expect(result).toEqual({ received: true });
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentStatus.SUCCESS }),
        }),
      );
      expect(mockPrisma.ticket.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledTimes(2); // WA and Email
    });

    it('harus menolak request dengan UnauthorizedException jika signature DOKU salah', async () => {
      const body = {
        transaction: { status: 'SUCCESS' },
        order: { invoice_number: invoiceNumber, amount: 150000 },
      };
      const rawBody = JSON.stringify(body);
      const headers = {
        'client-id': mockClientId,
        'request-id': 'req-invalid',
        'request-timestamp': '2026-09-17T08:50:25Z',
        signature: 'HMACSHA256=invalid_signature_hash',
      };

      await expect(
        service.handleWebhook(
          body,
          'doku',
          headers,
          rawBody,
          '/payments/webhook/doku',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus menolak request dengan BadRequestException jika amount tidak sama dengan order.totalAmount di DB', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const body = {
        transaction: { status: 'SUCCESS' },
        order: { invoice_number: invoiceNumber, amount: 999999 }, // Nominal dimanipulasi
      };
      const rawBody = JSON.stringify(body);
      const requestId = 'req-amount-mismatch';
      const timestamp = '2026-09-17T08:50:25Z';
      const target = '/payments/webhook/doku';

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        rawBody,
      );

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature,
      };

      await expect(
        service.handleWebhook(body, 'doku', headers, rawBody, target),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus idempotent: jika order sudah PAID, return received tanpa membuat ulang tiket', async () => {
      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockPrisma.order.findFirst.mockResolvedValue(paidOrder);

      const body = {
        transaction: { status: 'SUCCESS' },
        order: { invoice_number: invoiceNumber, amount: 150000 },
      };
      const rawBody = JSON.stringify(body);
      const requestId = 'req-idempotent';
      const timestamp = '2026-09-17T08:50:25Z';
      const target = '/payments/webhook/doku';

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        rawBody,
      );

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature,
      };

      const result = await service.handleWebhook(
        body,
        'doku',
        headers,
        rawBody,
        target,
      );

      expect(result).toEqual({ received: true, status: 'already_paid' });
      expect(mockPrisma.ticket.create).not.toHaveBeenCalled();
    });

    it('harus menangani status FAILED: payment diupdate FAILED, tetapi order tetap PENDING (tidak dibatalkan langsung)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const body = {
        transaction: { status: 'FAILED' },
        order: { invoice_number: invoiceNumber, amount: 150000 },
      };
      const rawBody = JSON.stringify(body);
      const requestId = 'req-failed';
      const timestamp = '2026-09-17T08:50:25Z';
      const target = '/payments/webhook/doku';

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        rawBody,
      );

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature,
      };

      const result = await service.handleWebhook(
        body,
        'doku',
        headers,
        rawBody,
        target,
      );

      expect(result).toEqual({ received: true });
      // Payment diubah ke FAILED
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: mockOrder.payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      // Order TIDAK diubah ke CANCELLED
      expect(mockPrisma.order.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.CANCELLED },
        }),
      );
    });

    it('harus menangani status EXPIRED: order diupdate EXPIRED dan kuota tiket dikembalikan', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const body = {
        transaction: { status: 'EXPIRED' },
        order: { invoice_number: invoiceNumber, amount: 150000 },
      };
      const rawBody = JSON.stringify(body);
      const requestId = 'req-expired';
      const timestamp = '2026-09-17T08:50:25Z';
      const target = '/payments/webhook/doku';

      const signature = service.generateDokuSignature(
        mockSecretKey,
        mockClientId,
        requestId,
        timestamp,
        target,
        rawBody,
      );

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature,
      };

      const result = await service.handleWebhook(
        body,
        'doku',
        headers,
        rawBody,
        target,
      );

      expect(result).toEqual({ received: true });
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.EXPIRED },
      });
      expect(mockPrisma.ticketCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { sold: { decrement: 1 } },
      });
    });
  });

  describe('checkDokuOrderStatus & handleScheduledStatusCheck (FASE V Fallback)', () => {
    const orderId = 'order-uuid-fallback-123';
    const invoiceNumber = `TAQTIX-ORD-${orderId}`;
    const amount = 250000;

    const mockOrder = {
      id: orderId,
      totalAmount: amount,
      status: OrderStatus.PENDING,
      eventId: 'event-uuid-1',
      buyerId: 'user-uuid-1',
      payment: {
        id: 'payment-uuid-fallback',
        status: PaymentStatus.PENDING,
        externalId: invoiceNumber,
        provider: 'doku',
      },
      orderItems: [
        {
          id: 'item-fallback-1',
          qty: 2,
          ticketCategoryId: 'cat-1',
          attendeeName: 'Siti',
          attendeeEmail: 'siti@example.com',
          attendeePhone: '081299998888',
          ticketCategory: { name: 'Festival' },
        },
      ],
      event: {
        id: 'event-uuid-1',
        title: 'Festival Musik',
        endDate: new Date('2026-11-01T23:59:59Z'),
      },
      buyer: {
        id: 'user-uuid-1',
        name: 'Siti',
        email: 'siti@example.com',
      },
    };

    it('harus sinkronisasi status SUCCESS jika checkDokuOrderStatus mendeteksi status transaksi SUCCESS', async () => {
      const dokuService = (service as any).dokuService;
      jest.spyOn(dokuService, 'checkStatus').mockResolvedValue({
        success: true,
        transactionStatus: 'SUCCESS',
        transactionId: 'DOKU-TRX-9988',
        transactionDate: '2026-09-17T09:00:00Z',
        rawData: { status: 'SUCCESS' },
      });

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.ticket.create.mockResolvedValue({ id: 'ticket-fallback-1' });
      mockPrisma.ticket.update.mockResolvedValue({
        id: 'ticket-fallback-1',
        qrPayload: 'qr-code-fallback',
        orderItem: mockOrder.orderItems[0],
      });

      const res = await service.checkDokuOrderStatus(invoiceNumber);

      expect(res.success).toBe(true);
      expect(res.transactionStatus).toBe('SUCCESS');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    it('handleScheduledStatusCheck harus memproses semua pending order yang mendekati expired', async () => {
      mockPrisma.order.findMany = jest.fn().mockResolvedValue([mockOrder]);
      const checkSpy = jest
        .spyOn(service, 'checkDokuOrderStatus')
        .mockResolvedValue({ success: true, transactionStatus: 'SUCCESS' });

      await service.handleScheduledStatusCheck();

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
            payment: { provider: 'doku' },
          }),
        }),
      );
      expect(checkSpy).toHaveBeenCalledWith(invoiceNumber);
    });
  });
});
