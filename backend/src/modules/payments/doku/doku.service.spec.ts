import { Test, TestingModule } from '@nestjs/testing';
import { DokuService } from './doku.service';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from './doku-signature.util';

describe('DokuService', () => {
  let service: DokuService;
  let configService: any;

  const mockClientId = 'BRN-0283-1788009869793';
  const mockSecretKey = 'SK-DOKU-TEST-KEY-12345';

  const mockConfig: Record<string, string> = {
    DOKU_CLIENT_ID: mockClientId,
    DOKU_SECRET_KEY: mockSecretKey,
    DOKU_ENV: 'sandbox',
    DOKU_BASE_URL_SANDBOX: 'https://api-sandbox.doku.com',
    TAQTIX_FRONTEND_URL: 'https://taqtix.id',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfig[key]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DokuService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DokuService>(DokuService);
    configService = module.get(ConfigService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPayment', () => {
    const mockOrder = {
      id: 'order-123',
      totalAmount: 150000,
      buyerId: 'buyer-1',
      buyer: {
        id: 'buyer-1',
        name: 'Budi',
        email: 'budi@test.com',
        phone: '08123456789',
      },
      orderItems: [
        {
          qty: 1,
          unitPrice: 150000,
          ticketCategory: { name: 'VIP Ticket' },
          attendeeName: 'Budi',
          attendeeEmail: 'budi@test.com',
          attendeePhone: '08123456789',
        },
      ],
    };

    const mockPayment = {
      id: 'payment-1',
      orderId: 'order-123',
    };

    it('harus memanggil API DOKU Checkout dengan parameter dan signature yang benar', async () => {
      const mockDokuResponse = {
        response: {
          payment: {
            token_id: 'token-xyz-123',
            url: 'https://app-uat.doku.com/checkout/link/12345',
            expired_date: '20260917184542',
          },
          order: { session_id: 'sess-1' },
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDokuResponse),
      } as any);

      const result = await service.createPayment(mockOrder, mockPayment);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-sandbox.doku.com/checkout/v1/payment',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Client-Id': mockClientId,
            'Content-Type': 'application/json',
          }),
        }),
      );

      expect(result.paymentUrl).toBe(
        'https://app-uat.doku.com/checkout/link/12345',
      );
      expect(result.tokenId).toBe('token-xyz-123');
      expect(result.invoiceNumber).toBe('TAQTIX-ORD-order-123');
      expect(result.expiredDate).toBeInstanceOf(Date);
      expect(result.expiredDate?.toISOString()).toBe(
        '2026-09-17T11:45:42.000Z',
      );
    });

    it('harus melempar BadRequestException jika fetch DOKU gagal', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Invalid merchant' }),
      } as any);

      await expect(
        service.createPayment(mockOrder, mockPayment),
      ).rejects.toThrow('Invalid merchant');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('harus mengembalikan true jika incoming signature webhook cocok', () => {
      const requestId = 'req-wh-1';
      const timestamp = '2026-09-17T08:50:00Z';
      const target = '/payments/webhook/doku';
      const rawBody = JSON.stringify({ transaction: { status: 'SUCCESS' } });

      const signature = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId,
        timestamp,
        requestTarget: target,
        bodyString: rawBody,
      });

      const headers = {
        'client-id': mockClientId,
        'request-id': requestId,
        'request-timestamp': timestamp,
        signature,
      };

      const isValid = service.verifyWebhookSignature(headers, rawBody, target);
      expect(isValid).toBe(true);
    });

    it('harus mengembalikan false jika incoming signature webhook salah', () => {
      const headers = {
        'client-id': mockClientId,
        'request-id': 'req-1',
        'request-timestamp': '2026-09-17T08:50:00Z',
        signature: 'HMACSHA256=invalid-signature',
      };

      const isValid = service.verifyWebhookSignature(
        headers,
        '{"some":"data"}',
        '/payments/webhook/doku',
      );
      expect(isValid).toBe(false);
    });
  });

  describe('checkStatus', () => {
    it('harus mengirim GET request dengan signature tanpa Digest dan mengembalikan data status', async () => {
      const invoiceNumber = 'TAQTIX-ORD-order-123';
      const mockStatusResponse = {
        transaction: {
          status: 'SUCCESS',
          id: 'TRX-999',
          date: '2026-09-17T08:55:00Z',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatusResponse),
      } as any);

      const result = await service.checkStatus(invoiceNumber);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api-sandbox.doku.com/orders/v1/status/${invoiceNumber}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Client-Id': mockClientId,
          }),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.transactionStatus).toBe('SUCCESS');
      expect(result.transactionId).toBe('TRX-999');
    });
  });
});
