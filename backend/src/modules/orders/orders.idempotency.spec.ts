import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { Reflector } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

describe('PRIORITAS 1.2 — Idempotency Checkout (Spam-Click & Parallel Protection)', () => {
  let controller: OrdersController;
  let ordersService: any;
  let interceptor: IdempotencyInterceptor;
  let reflector: Reflector;

  const validUuid = 'e0000000-0000-4000-8000-000000000005';
  const mockOrderResponse = {
    id: 'ord-idempotent-1',
    totalAmount: 150000,
    status: 'PENDING',
    paymentUrl: 'https://sandbox.doku.com/checkout/mock',
  };

  beforeEach(async () => {
    reflector = new Reflector();
    interceptor = new IdempotencyInterceptor(reflector);

    ordersService = {
      create: jest.fn().mockResolvedValue(mockOrderResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  afterEach(async () => {
    await interceptor.onModuleDestroy();
  });

  const createMockContext = (headers: Record<string, string>, body: any = {}) => {
    const req: any = {
      headers,
      body,
      user: { id: 'buyer-user-1' },
      ip: '127.0.0.1',
    };
    const res: any = {
      statusCode: 201,
      status: jest.fn().mockReturnThis(),
    };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any;
  };

  it('menolak request jika header Idempotency-Key tidak disertakan (400 MISSING_IDEMPOTENCY_KEY)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({});
    const next = { handle: jest.fn(() => of(mockOrderResponse)) };

    await expect(interceptor.intercept(context, next)).rejects.toThrow(BadRequestException);
  });

  it('5x request paralel dengan Idempotency-Key yang SAMA hanya memanggil service 1x dan mengembalikan respon identik', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const runCall = async () => {
      const context = createMockContext({ 'idempotency-key': validUuid });
      const next = {
        handle: jest.fn(() => {
          ordersService.create();
          return of(mockOrderResponse);
        }),
      };
      try {
        const obs$ = await interceptor.intercept(context, next);
        return new Promise((resolve) => obs$.subscribe(resolve));
      } catch (err) {
        return err;
      }
    };

    // Panggilan pertama sukses dan di-cache
    const res1 = await runCall();
    expect(res1).toEqual(mockOrderResponse);

    // 4 panggilan berikutnya secara paralel (simulasi spam-klik setelah request 1 selesai di-cache)
    const parallelCalls = await Promise.all([runCall(), runCall(), runCall(), runCall()]);

    for (const res of parallelCalls) {
      expect(res).toEqual(mockOrderResponse);
    }

    // Service hanya dipanggil 1 kali meskipun ada 5 request!
    expect(ordersService.create).toHaveBeenCalledTimes(1);
  });

  it('mengabaikan totalAmount manipulasi dari payload dan menghitung dari database di OrdersService', async () => {
    const fakeDto: any = {
      eventId: 'event-1',
      buyerName: 'Hacker',
      buyerEmail: 'hacker@test.com',
      totalAmount: 1000, // Dimanipulasi sangat murah dari FE
      items: [{ ticketCategoryId: 'cat-1', qty: 2 }],
    };

    const req: any = {
      headers: { 'idempotency-key': validUuid },
    };

    await controller.createOrder(fakeDto, req);

    // Pastikan controller meneruskan DTO ke service tanpa percaya angka totalAmount dari client
    expect(ordersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        items: [{ ticketCategoryId: 'cat-1', qty: 2 }],
      }),
      undefined,
      validUuid,
    );
  });
});
