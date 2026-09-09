import { Reflector } from '@nestjs/core';
import { BadRequestException, ConflictException, ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { REQUIRE_IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new IdempotencyInterceptor(reflector);
  });

  afterEach(async () => {
    await interceptor.onModuleDestroy();
  });

  const createMockContext = (headers: Record<string, string> = {}, user: any = { id: 'user-123' }) => {
    const req = {
      headers,
      user,
      ip: '127.0.0.1',
    };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
    };

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;
  };

  const createMockHandler = (result: any = { success: true, data: { id: 'order-1' } }): CallHandler => {
    return {
      handle: jest.fn(() => of(result)),
    };
  };

  it('harus membiarkan request lewat jika endpoint tidak memerlukan idempotency', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext();
    const handler = createMockHandler();

    const result$ = await interceptor.intercept(context, handler);
    result$.subscribe((val) => {
      expect(val).toEqual({ success: true, data: { id: 'order-1' } });
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });
  });

  it('harus melempar BadRequestException jika header Idempotency-Key tidak ada', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({});
    const handler = createMockHandler();

    await expect(interceptor.intercept(context, handler)).rejects.toThrow(BadRequestException);
    try {
      await interceptor.intercept(context, handler);
    } catch (err: any) {
      expect(err.getResponse()).toEqual({
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Header Idempotency-Key wajib disertakan untuk request ini',
      });
    }
  });

  it('harus melempar BadRequestException jika format Idempotency-Key bukan UUID valid', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({ 'idempotency-key': 'not-a-valid-uuid' });
    const handler = createMockHandler();

    await expect(interceptor.intercept(context, handler)).rejects.toThrow(BadRequestException);
    try {
      await interceptor.intercept(context, handler);
    } catch (err: any) {
      expect(err.getResponse()).toEqual({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Header Idempotency-Key harus berformat UUID v4 yang valid',
      });
    }
  });

  it('harus sukses memproses request dengan UUID valid dan menyimpan cache', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const uuid = 'a0000000-0000-4000-8000-000000000001';
    const context = createMockContext({ 'idempotency-key': uuid });
    const handler = createMockHandler({ orderId: 'ord-123', total: 50000 });

    const result$ = await interceptor.intercept(context, handler);
    result$.subscribe((val) => {
      expect(val).toEqual({ orderId: 'ord-123', total: 50000 });
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });
  });

  it('harus menolak request kedua dengan ConflictException (409) jika request pertama masih in-progress (race condition lock)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const uuid = 'b0000000-0000-4000-8000-000000000002';
    const context = createMockContext({ 'idempotency-key': uuid });

    // Simulasi handler yang membutuhkan waktu (belum selesai)
    const longRunningHandler: CallHandler = {
      handle: () => of({ done: true }),
    };

    // Panggil pertama
    await interceptor.intercept(context, longRunningHandler);

    // Kunci manual untuk simulasi in-progress sebelum release
    (interceptor as any).inMemoryLocks.set(`idempotency:lock:user-123:${uuid}`, Date.now() + 10000);

    // Request kedua dengan key yang sama saat lock masih aktif
    await expect(interceptor.intercept(context, createMockHandler())).rejects.toThrow(ConflictException);
    try {
      await interceptor.intercept(context, createMockHandler());
    } catch (err: any) {
      expect(err.getResponse()).toEqual({
        code: 'REQUEST_IN_PROGRESS',
        message: 'Permintaan dengan Idempotency-Key ini sedang diproses. Mohon tunggu.',
      });
    }
  });

  it('harus mengembalikan cached response identik tanpa mengeksekusi ulang handler jika key sudah pernah sukses', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const uuid = 'c0000000-0000-4000-8000-000000000003';
    const context = createMockContext({ 'idempotency-key': uuid });
    const handler = createMockHandler({ transactionId: 'tx-999', status: 'paid' });

    // Request 1
    const result1$ = await interceptor.intercept(context, handler);
    await new Promise<void>((resolve) => {
      result1$.subscribe((val) => {
        expect(val).toEqual({ transactionId: 'tx-999', status: 'paid' });
        resolve();
      });
    });
    expect(handler.handle).toHaveBeenCalledTimes(1);

    // Request 2 dengan Idempotency-Key yang sama
    const handler2 = createMockHandler({ transactionId: 'tx-SHOULD-NOT-RUN' });
    const result2$ = await interceptor.intercept(context, handler2);

    await new Promise<void>((resolve) => {
      result2$.subscribe((val) => {
        // Harus mengembalikan hasil dari Request 1, bukan Request 2
        expect(val).toEqual({ transactionId: 'tx-999', status: 'paid' });
        // Handler 2 TIDAK PERNAH dipanggil!
        expect(handler2.handle).not.toHaveBeenCalled();
        resolve();
      });
    });
  });
});
