import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { DokuService } from '../payments/doku/doku.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { HttpException, HttpStatus } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('PRIORITAS 1.1 — Anti Double-Booking & Quota Locking (Concurrency)', () => {
  let service: OrdersService;
  let currentSold: number;
  const maxQuota = 10;

  beforeEach(async () => {
    currentSold = 0;

    const mockPrisma: any = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        // Simulasi transaksi database atomik
        return cb(mockPrisma);
      }),
      $queryRaw: jest.fn(async () => {
        // Simulasi SELECT ... FOR UPDATE dengan atomic read
        return [
          {
            id: 'cat-concurrency-1',
            quota: maxQuota,
            sold: currentSold,
            name: 'Ticket Concurrency',
            price: 50000,
          },
        ];
      }),
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-concurrency-1',
          title: 'Event Concurrency Test',
          organizerId: 'org-1',
          requireLogin: false,
          customFormFields: [],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'buyer-test-1', email: 'buyer@test.com' }),
        create: jest.fn().mockResolvedValue({ id: 'buyer-test-1', email: 'buyer@test.com' }),
      },
      ticketCategory: {
        update: jest.fn(async (args: any) => {
          if (args.data?.sold?.increment) {
            currentSold += args.data.sold.increment;
          }
          return { id: 'cat-concurrency-1', quota: maxQuota, sold: currentSold };
        }),
      },
      eventFacility: {
        update: jest.fn(),
      },
      order: {
        create: jest.fn().mockImplementation((args: any) => ({
          id: `ord-${Math.random().toString(36).substring(7)}`,
          ...args.data,
          status: OrderStatus.PENDING,
          expiredAt: new Date(Date.now() + 600000),
        })),
        findUnique: jest.fn().mockImplementation((args: any) => ({
          id: args.where.id,
          eventId: 'event-concurrency-1',
          totalAmount: 50000,
          status: OrderStatus.PENDING,
          buyer: { id: 'buyer-test-1', email: 'buyer@test.com' },
          orderItems: [],
          payment: { id: 'pay-1', status: PaymentStatus.PENDING, provider: 'doku' },
        })),
        update: jest.fn(),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
      },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
        update: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      },
      promoCode: { update: jest.fn() },
      voucher: { findFirst: jest.fn(), update: jest.fn() },
    };

    const mockDokuService = {
      getConfig: jest.fn().mockReturnValue({
        clientId: 'DOKU-CLIENT-123',
        secretKey: 'DOKU-SECRET-456',
        baseUrl: 'https://api-sandbox.doku.com',
        isProduction: false,
      }),
      createPayment: jest.fn().mockResolvedValue({
        paymentUrl: 'https://sandbox.doku.com/checkout/mock',
        tokenId: 'DOKU-TOK-1',
        expiredDate: new Date(),
        invoiceNumber: 'INV-1',
      }),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('https://taqtix.id'),
    };

    const mockQueue = {
      add: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DokuService, useValue: mockDokuService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getQueueToken('order-expiration'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('tidak boleh oversell ketika 20 request beruntun/konkuren masuk ke kategori tiket berkuota 10', async () => {
    const results: { success: boolean; error?: any }[] = [];

    // Simulasi 20 pemesanan
    for (let i = 0; i < 20; i++) {
      try {
        await service.create({
          eventId: 'event-concurrency-1',
          buyerName: `Buyer ${i}`,
          buyerEmail: `buyer${i}@test.com`,
          buyerPhone: '081234567890',
          items: [{ ticketCategoryId: 'cat-concurrency-1', qty: 1 }],
        });
        results.push({ success: true });
      } catch (err: any) {
        results.push({ success: false, error: err });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Tepat 10 yang berhasil dan 10 yang gagal
    expect(successCount).toBe(10);
    expect(failedCount).toBe(10);
    expect(currentSold).toBe(10);

    // Semua yang gagal harus berstatus TICKET_SOLD_OUT (409 Conflict atau 422)
    const errors = results.filter((r) => !r.success).map((r) => r.error);
    for (const error of errors) {
      expect(error).toBeInstanceOf(HttpException);
      const response = (error as HttpException).getResponse() as any;
      expect(response.code).toBe('TICKET_SOLD_OUT');
    }
  });

  it('menolak pesanan bila kuota tiket tersisa lebih kecil daripada qty yang diminta', async () => {
    currentSold = 9; // Kuota 10, tersisa 1

    await expect(
      service.create({
        eventId: 'event-concurrency-1',
        buyerName: 'Buyer Greedy',
        buyerEmail: 'greedy@test.com',
        buyerPhone: '081234567890',
        items: [{ ticketCategoryId: 'cat-concurrency-1', qty: 2 }],
      }),
    ).rejects.toThrow(HttpException);
  });
});
