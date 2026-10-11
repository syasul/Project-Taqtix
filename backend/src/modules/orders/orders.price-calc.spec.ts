import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { DokuService } from '../payments/doku/doku.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';

describe('PRIORITAS 1.5 — Kalkulasi Harga di Backend (Tidak Percaya FE)', () => {
  let service: OrdersService;
  let prisma: any;

  const mockEvent = {
    id: 'event-calc-1',
    title: 'Konser Musik',
    organizerId: 'org-calc-1',
    requireLogin: false,
    customFormFields: [],
  };

  const mockBuyer = {
    id: 'buyer-calc-1',
    email: 'buyer@test.com',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(prisma)),
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'cat-calc-1',
          quota: 100,
          sold: 10,
          name: 'Regular',
          price: 150000, // Harga asli di database Rp 150.000
        },
      ]),
      event: { findUnique: jest.fn().mockResolvedValue(mockEvent) },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockBuyer),
        create: jest.fn().mockResolvedValue(mockBuyer),
      },
      ticketCategory: { update: jest.fn() },
      order: {
        create: jest.fn().mockImplementation((args: any) => ({
          id: 'ord-calc-123',
          ...args.data,
        })),
        findUnique: jest.fn().mockImplementation((args: any) => ({
          id: args.where.id,
          totalAmount: 300000,
          buyer: mockBuyer,
          orderItems: [],
          payment: null,
        })),
        update: jest.fn(),
      },
      orderItem: { create: jest.fn() },
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'pay-calc-1', status: 'PENDING' }),
        update: jest.fn(),
      },
      voucher: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'vouch-calc-1',
          code: 'HEMAT20',
          type: 'percentage',
          value: 20, // 20% diskon
          status: 'active',
          validFrom: new Date(Date.now() - 10000),
          validUntil: new Date(Date.now() + 1000000),
          usageCount: 0,
          usageLimit: 100,
          maxDiscountAmount: 50000,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'vouch-calc-1',
          code: 'HEMAT20',
          type: 'percentage',
          value: 20,
          maxDiscountAmount: 50000,
        }),
        update: jest.fn(),
      },
      promoCode: { update: jest.fn() },
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: DokuService, useValue: mockDokuService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getQueueToken('order-expiration'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('mengabaikan totalAmount manipulasi dari FE dan menghitung dari harga database (150.000 x 2 = 300.000)', async () => {
    const maliciousDto: any = {
      eventId: 'event-calc-1',
      buyerName: 'Hacker',
      buyerEmail: 'buyer@test.com',
      totalAmount: 1000, // Hacker mencoba kirim 1000
      items: [{ ticketCategoryId: 'cat-calc-1', qty: 2 }],
    };

    await service.create(maliciousDto);

    // Pastikan order yang dibuat di database mencatat totalAmount = 300.000 (bukan 1.000)
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 300000,
          discountAmount: 0,
        }),
      }),
    );
  });

  it('mengabaikan discountAmount manipulasi dari FE dan menghitung diskon voucher murni di BE', async () => {
    const maliciousVoucherDto: any = {
      eventId: 'event-calc-1',
      buyerName: 'Hacker',
      buyerEmail: 'buyer@test.com',
      promoCode: 'HEMAT20',
      discountAmount: 299000, // Hacker mencoba klaim diskon hampir 100%
      totalAmount: 1000,
      items: [{ ticketCategoryId: 'cat-calc-1', qty: 2 }],
    };

    await service.create(maliciousVoucherDto);

    // Total dasar: 150.000 x 2 = 300.000
    // Diskon 20% = 60.000, dicap ke maxDiscountAmount = 50.000
    // totalAmount akhir yang benar = 300.000 - 50.000 = 250.000
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 250000,
          discountAmount: 50000,
        }),
      }),
    );
  });
});
