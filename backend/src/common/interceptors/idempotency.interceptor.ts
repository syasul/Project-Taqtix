import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import Redis from 'ioredis';
import { REQUIRE_IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';

interface CachedResponse {
  statusCode: number;
  body: any;
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private redis: Redis | null = null;

  // Fallback in-memory jika Redis tidak aktif (misal saat testing unit atau offline dev)
  private readonly inMemoryLocks = new Map<string, number>();
  private readonly inMemoryCache = new Map<
    string,
    { data: CachedResponse; expiresAt: number }
  >();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService?: ConfigService,
  ) {
    this.initRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
    }
  }

  private initRedis() {
    try {
      const redisUrl =
        this.configService?.get<string>('REDIS_URL') ||
        process.env.REDIS_URL ||
        'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 2000,
      });

      this.redis.on('error', (err) => {
        // Jangan crash jika Redis offline di lokal, gunakan in-memory fallback
        this.logger.warn(
          `Redis offline atau tidak terjangkau (${err.message}), beralih ke in-memory idempotency fallback.`,
        );
      });

      this.redis.connect().catch(() => {
        // Diabaikan, fallback ke in-memory
      });
    } catch (err: any) {
      this.logger.warn(`Inisialisasi Redis error: ${err.message}`);
    }
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika endpoint tidak membutuhkan idempotency, teruskan
    if (!isRequired) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const rawKey =
      req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

    // 1. Validasi keberadaan header
    if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
      throw new BadRequestException({
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Header Idempotency-Key wajib disertakan untuk request ini',
      });
    }

    const idempotencyKey = rawKey.trim();

    // 2. Validasi format UUID v4
    if (!UUID_V4_REGEX.test(idempotencyKey)) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Header Idempotency-Key harus berformat UUID v4 yang valid',
      });
    }

    // 3. Identifikasi User / Client Scoping
    const userId = (req as any).user?.id || req.ip || 'anonymous';
    const lockKey = `idempotency:lock:${userId}:${idempotencyKey}`;
    const resultKey = `idempotency:result:${userId}:${idempotencyKey}`;

    // 4. Periksa apakah request ini SUDAH PERNAH sukses diproses sebelumnya (TTL 24 Jam)
    const cached = await this.getCachedResult(resultKey);
    if (cached) {
      this.logger.log(
        `[Idempotency] Replay cached response untuk key: ${idempotencyKey}`,
      );
      res.status(cached.statusCode);
      return of(cached.body);
    }

    // 5. Coba acquire lock singkat (30 detik) untuk mencegah race-condition spam-klik simultan
    const lockAcquired = await this.acquireLock(lockKey, 30000);
    if (!lockAcquired) {
      throw new ConflictException({
        code: 'REQUEST_IN_PROGRESS',
        message:
          'Permintaan dengan Idempotency-Key ini sedang diproses. Mohon tunggu.',
      });
    }

    // 6. Jalankan proses mutasi data
    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          const statusCode = res.statusCode || 200;
          // Simpan response sukses ke Redis (TTL 24 jam = 86400 detik)
          await this.setCachedResult(
            resultKey,
            { statusCode, body: responseBody },
            86400,
          );
        } catch (err: any) {
          this.logger.error(`Gagal menyimpan cache idempotency: ${err.message}`);
        } finally {
          // Lepaskan penanda lock
          await this.releaseLock(lockKey);
        }
      }),
      catchError(async (err) => {
        // Jika terjadi error pada proses, segera lepaskan lock agar user bisa retry
        await this.releaseLock(lockKey);
        throw err;
      }),
    );
  }

  // --- HELPER METODE CACHE & LOCK (DENGAN IN-MEMORY FALLBACK) ---

  private async getCachedResult(key: string): Promise<CachedResponse | null> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data) as CachedResponse;
        }
      } catch {
        // fallback to in-memory
      }
    }

    const memoryItem = this.inMemoryCache.get(key);
    if (memoryItem) {
      if (Date.now() < memoryItem.expiresAt) {
        return memoryItem.data;
      }
      this.inMemoryCache.delete(key);
    }
    return null;
  }

  private async setCachedResult(
    key: string,
    data: CachedResponse,
    ttlSeconds: number,
  ): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
        return;
      } catch {
        // fallback to in-memory
      }
    }

    this.inMemoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async acquireLock(
    key: string,
    ttlMillis: number,
  ): Promise<boolean> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        const result = await this.redis.set(
          key,
          'IN_PROGRESS',
          'PX',
          ttlMillis,
          'NX',
        );
        return result === 'OK';
      } catch {
        // fallback to in-memory
      }
    }

    const now = Date.now();
    const existingExpiry = this.inMemoryLocks.get(key);
    if (existingExpiry && existingExpiry > now) {
      return false; // Sedang diproses
    }

    this.inMemoryLocks.set(key, now + ttlMillis);
    return true;
  }

  private async releaseLock(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(key);
        return;
      } catch {
        // fallback
      }
    }
    this.inMemoryLocks.delete(key);
  }
}
