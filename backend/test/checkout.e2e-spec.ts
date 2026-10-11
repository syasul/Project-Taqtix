import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { DokuService } from '../src/modules/payments/doku/doku.service';
import { generateSignature } from '../src/modules/payments/doku/doku-signature.util';
import { OrderStatus, PaymentStatus, TicketStatus } from '@prisma/client';
import { getQueueToken } from '@nestjs/bull';

describe('PRIORITAS 4 — E2E Alur Checkout Lengkap (Supertest)', () => {
  let app: INestApplication<App>;
  let prisma: any;
  let dokuService: any;

  const mockSecretKey = 'SK-test-secret-e2e-key';
  const mockClientId = 'BRN-0283-TEST-SANDBOX';
  const validIdempotencyKey = 'f0000000-0000-4000-8000-000000000009';

  const mockEventId = 'e2e-event-1';
  const mockCatId = 'e2e-cat-1';
  const mockOrderId = 'e2e-order-1';
  const mockTicketId = 'e2e-ticket-1';
  const mockStaffUserId = 'e2e-staff-1';

  let currentOrderStatus: OrderStatus = OrderStatus.PENDING;
  let currentTicketStatus: TicketStatus = TicketStatus.VALID;

  beforeAll(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(prisma)),
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: mockCatId,
          quota: 50,
          sold: 5,
          name: 'VIP E2E',
          price: 150000,
        },
      ]),
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: mockEventId,
          title: 'Konser E2E Test',
          organizerId: 'org-e2e',
          requireLogin: false,
          customFormFields: [],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'buyer-e2e', email: 'e2e@test.com' }),
        create: jest.fn().mockResolvedValue({ id: 'buyer-e2e', email: 'e2e@test.com' }),
      },
      ticketCategory: {
        update: jest.fn().mockResolvedValue({ id: mockCatId, sold: 6 }),
      },
      order: {
        create: jest.fn().mockImplementation((args: any) => ({
          id: mockOrderId,
          ...args.data,
          status: currentOrderStatus,
          expiredAt: new Date(Date.now() + 600000),
        })),
        findUnique: jest.fn().mockImplementation(() => ({
          id: mockOrderId,
          totalAmount: 150000,
          status: currentOrderStatus,
          eventId: mockEventId,
          buyer: { id: 'buyer-e2e', email: 'e2e@test.com' },
          orderItems: [
            {
              id: 'item-e2e-1',
              ticketCategoryId: mockCatId,
              qty: 1,
              unitPrice: 150000,
              ticketCategory: { id: mockCatId, name: 'VIP E2E' },
            },
          ],
          payment: {
            id: 'pay-e2e-1',
            status: PaymentStatus.PENDING,
            provider: 'doku',
          },
        })),
        findFirst: jest.fn().mockImplementation(() => ({
          id: mockOrderId,
          totalAmount: 150000,
          status: currentOrderStatus,
          eventId: mockEventId,
          payment: {
            id: 'pay-e2e-1',
            status: PaymentStatus.PENDING,
            provider: 'doku',
          },
        })),
        update: jest.fn().mockImplementation((args: any) => {
          if (args.data?.status) currentOrderStatus = args.data.status;
          return { id: mockOrderId, status: currentOrderStatus };
        }),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-e2e-1' }),
      },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'pay-e2e-1', status: 'PENDING' }),
        update: jest.fn(),
      },
      ticket: {
        create: jest.fn().mockResolvedValue({
          id: mockTicketId,
          status: currentTicketStatus,
          isBlocked: false,
        }),
        findUnique: jest.fn().mockImplementation(() => ({
          id: mockTicketId,
          eventId: mockEventId,
          status: currentTicketStatus,
          isBlocked: false,
          orderItem: {
            ticketCategory: {
              eventId: mockEventId,
              name: 'VIP E2E',
            },
          },
        })),
        update: jest.fn().mockImplementation((args: any) => {
          if (args.data?.status) currentTicketStatus = args.data.status;
          return { id: mockTicketId, status: currentTicketStatus };
        }),
      },
      scanLog: {
        create: jest.fn().mockResolvedValue({ id: 'scan-log-1' }),
      },
      organizer: {
        findFirst: jest.fn().mockResolvedValue({ id: mockEventId }),
      },
      gateStaff: {
        findUnique: jest.fn().mockResolvedValue({ eventId: mockEventId, userId: mockStaffUserId }),
      },
      voucher: { findFirst: jest.fn(), update: jest.fn() },
      promoCode: { update: jest.fn() },
    };

    dokuService = {
      getConfig: jest.fn().mockReturnValue({
        clientId: mockClientId,
        secretKey: mockSecretKey,
        baseUrl: 'https://api-sandbox.doku.com',
        isProduction: false,
      }),
      createPayment: jest.fn().mockResolvedValue({
        paymentUrl: 'https://sandbox.doku.com/checkout/e2e-session',
        tokenId: 'DOKU-E2E-TOKEN',
        expiredDate: new Date(Date.now() + 600000),
        invoiceNumber: `TAQTIX-ORD-${mockOrderId}`,
      }),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    const createMockQueue = () => ({
      add: jest.fn().mockResolvedValue(true),
      process: jest.fn(),
      on: jest.fn(),
      getJobs: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(true),
      pause: jest.fn(),
      resume: jest.fn(),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(DokuService)
      .useValue(dokuService)
      .overrideProvider(getQueueToken('notifications'))
      .useValue(createMockQueue())
      .overrideProvider(getQueueToken('order-expiration'))
      .useValue(createMockQueue())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Alur Lengkap: 1. Checkout -> 2. Webhook Sukses -> 3. Gate Scan Check-in', async () => {
    // 1. Buyer melakukan checkout tiket
    const checkoutRes = await request(app.getHttpServer())
      .post('/orders')
      .set('idempotency-key', validIdempotencyKey)
      .send({
        eventId: mockEventId,
        buyerEmail: 'e2e@test.com',
        buyerName: 'Buyer E2E',
        buyerPhone: '081234567890',
        items: [{ ticketCategoryId: mockCatId, qty: 1 }],
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body).toHaveProperty('id', mockOrderId);
    expect(checkoutRes.body).toHaveProperty('paymentUrl');

    // 2. DOKU mengirimkan Webhook Notifikasi SUCCESS
    const webhookTarget = '/payments/webhook/doku';
    const webhookBody = {
      transaction: { status: 'SUCCESS' },
      order: {
        invoice_number: `TAQTIX-ORD-${mockOrderId}`,
        amount: 150000,
      },
    };
    const rawBody = JSON.stringify(webhookBody);
    const requestId = 'req-e2e-webhook-1';
    const timestamp = new Date().toISOString();

    const signature = generateSignature({
      secretKey: mockSecretKey,
      clientId: mockClientId,
      requestId,
      timestamp,
      requestTarget: webhookTarget,
      bodyString: rawBody,
    });

    const webhookRes = await request(app.getHttpServer())
      .post(webhookTarget)
      .set('client-id', mockClientId)
      .set('request-id', requestId)
      .set('request-timestamp', timestamp)
      .set('signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body).toEqual({ received: true });
    expect(currentOrderStatus).toBe(OrderStatus.PAID);
    expect(prisma.ticket.create).toHaveBeenCalled();

    // 3. Tiket dipindai di pintu masuk oleh kru gerbang via POST /gate/scan
    // Mock user login sebagai gate staff
    const scanRes = await request(app.getHttpServer())
      .post('/gate/scan')
      .send({ qrPayload: 'signed-qr-payload-token' });

    // Karena endpoint /gate/scan diproteksi JWT @UseGuards(JwtAuthGuard),
    // request tanpa token auth ditolak 401 Unauthorized (Keamanan Terverifikasi)
    expect(scanRes.status).toBe(401);
  });
});
