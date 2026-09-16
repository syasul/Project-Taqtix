import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { DokuService } from '../payments/doku/doku.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('OrdersService - FASE III Create Payment & Rollback', () => {
  let service: OrdersService;
  let prisma: any;
  let dokuService: any;
  let queue: any;

  const mockOrderId = 'order-uuid-test-123';
  const mockDokuExpiredDate = new Date('2026-09-17T12:00:00.000Z');
  const mockPaymentUrl = 'https://sandbox.doku.com/checkout/mock-page-url';

  const mockEvent = {
    id: 'event-uuid-1',
    title: 'Konser Musik',
    organizerId: 'org-uuid-1',
    requireLogin: false,
    customFormFields: [],
    facilities: [],
  };

  const mockBuyer = {
    id: 'buyer-uuid-1',
    email: 'buyer@example.com',
  };

  const mockCreatedOrder = {
    id: mockOrderId,
    eventId: 'event-uuid-1',
    buyerId: 'buyer-uuid-1',
    totalAmount: 150000,
    status: OrderStatus.PENDING,
    expiredAt: new Date(Date.now() + 10 * 60 * 1000),
  };

  const mockFullOrder = {
    ...mockCreatedOrder,
    buyer: mockBuyer,
    orderItems: [
      {
        id: 'item-1',
        ticketCategoryId: 'cat-1',
        qty: 1,
        unitPrice: 150000,
        ticketCategory: { id: 'cat-1', name: 'VIP Ticket' },
      },
    ],
    payment: {
      id: 'payment-uuid-1',
      orderId: mockOrderId,
      amount: 150000,
      status: PaymentStatus.PENDING,
      provider: 'doku',
    },
  };

  const mockDto: any = {
    eventId: 'event-uuid-1',
    buyerName: 'Budi Santoso',
    buyerEmail: 'buyer@example.com',
    buyerPhone: '081234567890',
    items: [{ ticketCategoryId: 'cat-1', qty: 1 }],
  };

  beforeEach(async () => {
    const mockPrisma: any = {
      $transaction: jest.fn(async (cb: (tx: any) => any) => cb(mockPrisma)),
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'cat-1',
          quota: 100,
          sold: 10,
          name: 'VIP Ticket',
          price: 150000,
        },
      ]),
      event: { findUnique: jest.fn().mockResolvedValue(mockEvent) },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockBuyer),
        create: jest.fn().mockResolvedValue(mockBuyer),
      },
      ticketCategory: {
        update: jest.fn().mockResolvedValue({ id: 'cat-1', sold: 11 }),
      },
      order: {
        create: jest.fn().mockResolvedValue({ ...mockCreatedOrder }),
        findUnique: jest.fn().mockResolvedValue(mockFullOrder),
        update: jest.fn().mockResolvedValue({ ...mockCreatedOrder }),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue(mockFullOrder.payment),
        create: jest.fn().mockResolvedValue(mockFullOrder.payment),
        update: jest.fn().mockResolvedValue(mockFullOrder.payment),
      },
      promoCode: {
        update: jest.fn(),
      },
      voucher: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockDokuService = {
      getConfig: jest.fn().mockReturnValue({
        clientId: 'DOKU-CLIENT-123',
        secretKey: 'DOKU-SECRET-456',
        baseUrl: 'https://api-sandbox.doku.com',
        isProduction: false,
      }),
      createPayment: jest.fn().mockResolvedValue({
        paymentUrl: mockPaymentUrl,
        tokenId: 'DOKU-TOKEN-789',
        expiredDate: mockDokuExpiredDate,
        invoiceNumber: `TAQTIX-ORD-${mockOrderId}`,
      }),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'TAQTIX_FRONTEND_URL') return 'https://taqtix.id';
        return null;
      }),
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
    prisma = module.get(PrismaService);
    dokuService = module.get(DokuService);
    queue = module.get(getQueueToken('order-expiration'));
  });

  it('harus memanggil DokuService.createPayment, update Payment & Order.expiredAt, dan return paymentUrl', async () => {
    const result = await service.create(mockDto);

    expect(dokuService.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockOrderId }),
      expect.anything(),
    );

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalId: 'DOKU-TOKEN-789',
          snapToken: mockPaymentUrl,
          provider: 'doku',
        }),
      }),
    );

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockOrderId },
        data: { expiredAt: mockDokuExpiredDate },
      }),
    );

    expect(result).toHaveProperty('paymentUrl', mockPaymentUrl);
    expect(queue.add).toHaveBeenCalledWith(
      'expire-order',
      { orderId: mockOrderId },
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });

  it('harus melakukan rollback kuota tiket dan batalkan order jika DokuService.createPayment gagal', async () => {
    dokuService.createPayment.mockRejectedValue(
      new Error('Connection timeout to DOKU API'),
    );

    await expect(service.create(mockDto)).rejects.toThrow(BadRequestException);

    // Rollback: Order dibatalkan
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockOrderId },
        data: { status: OrderStatus.CANCELLED },
      }),
    );

    // Rollback: Kuota tiket dikembalikan
    expect(prisma.ticketCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cat-1' },
        data: { sold: { decrement: 1 } },
      }),
    );
  });
});
