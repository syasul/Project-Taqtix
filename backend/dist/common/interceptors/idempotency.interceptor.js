"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IdempotencyInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ioredis_1 = __importDefault(require("ioredis"));
const idempotency_decorator_1 = require("../decorators/idempotency.decorator");
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let IdempotencyInterceptor = IdempotencyInterceptor_1 = class IdempotencyInterceptor {
    reflector;
    configService;
    logger = new common_1.Logger(IdempotencyInterceptor_1.name);
    redis = null;
    inMemoryLocks = new Map();
    inMemoryCache = new Map();
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
        this.initRedis();
    }
    async onModuleDestroy() {
        if (this.redis) {
            try {
                await this.redis.quit();
            }
            catch {
                this.redis.disconnect();
            }
        }
    }
    initRedis() {
        try {
            const redisUrl = this.configService?.get('REDIS_URL') ||
                process.env.REDIS_URL ||
                'redis://localhost:6379';
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 1,
                enableReadyCheck: false,
                lazyConnect: true,
                connectTimeout: 2000,
            });
            this.redis.on('error', (err) => {
                this.logger.warn(`Redis offline atau tidak terjangkau (${err.message}), beralih ke in-memory idempotency fallback.`);
            });
            this.redis.connect().catch(() => {
            });
        }
        catch (err) {
            this.logger.warn(`Inisialisasi Redis error: ${err.message}`);
        }
    }
    async intercept(context, next) {
        const isRequired = this.reflector.getAllAndOverride(idempotency_decorator_1.REQUIRE_IDEMPOTENCY_KEY, [context.getHandler(), context.getClass()]);
        if (!isRequired) {
            return next.handle();
        }
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const rawKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
        if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
            throw new common_1.BadRequestException({
                code: 'MISSING_IDEMPOTENCY_KEY',
                message: 'Header Idempotency-Key wajib disertakan untuk request ini',
            });
        }
        const idempotencyKey = rawKey.trim();
        if (!UUID_V4_REGEX.test(idempotencyKey)) {
            throw new common_1.BadRequestException({
                code: 'INVALID_IDEMPOTENCY_KEY',
                message: 'Header Idempotency-Key harus berformat UUID v4 yang valid',
            });
        }
        const userId = req.user?.id || req.ip || 'anonymous';
        const lockKey = `idempotency:lock:${userId}:${idempotencyKey}`;
        const resultKey = `idempotency:result:${userId}:${idempotencyKey}`;
        const cached = await this.getCachedResult(resultKey);
        if (cached) {
            this.logger.log(`[Idempotency] Replay cached response untuk key: ${idempotencyKey}`);
            res.status(cached.statusCode);
            return (0, rxjs_1.of)(cached.body);
        }
        const lockAcquired = await this.acquireLock(lockKey, 30000);
        if (!lockAcquired) {
            throw new common_1.ConflictException({
                code: 'REQUEST_IN_PROGRESS',
                message: 'Permintaan dengan Idempotency-Key ini sedang diproses. Mohon tunggu.',
            });
        }
        return next.handle().pipe((0, operators_1.tap)(async (responseBody) => {
            try {
                const statusCode = res.statusCode || 200;
                await this.setCachedResult(resultKey, { statusCode, body: responseBody }, 86400);
            }
            catch (err) {
                this.logger.error(`Gagal menyimpan cache idempotency: ${err.message}`);
            }
            finally {
                await this.releaseLock(lockKey);
            }
        }), (0, operators_1.catchError)(async (err) => {
            await this.releaseLock(lockKey);
            throw err;
        }));
    }
    async getCachedResult(key) {
        if (this.redis && this.redis.status === 'ready') {
            try {
                const data = await this.redis.get(key);
                if (data) {
                    return JSON.parse(data);
                }
            }
            catch {
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
    async setCachedResult(key, data, ttlSeconds) {
        if (this.redis && this.redis.status === 'ready') {
            try {
                await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
                return;
            }
            catch {
            }
        }
        this.inMemoryCache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async acquireLock(key, ttlMillis) {
        if (this.redis && this.redis.status === 'ready') {
            try {
                const result = await this.redis.set(key, 'IN_PROGRESS', 'PX', ttlMillis, 'NX');
                return result === 'OK';
            }
            catch {
            }
        }
        const now = Date.now();
        const existingExpiry = this.inMemoryLocks.get(key);
        if (existingExpiry && existingExpiry > now) {
            return false;
        }
        this.inMemoryLocks.set(key, now + ttlMillis);
        return true;
    }
    async releaseLock(key) {
        if (this.redis && this.redis.status === 'ready') {
            try {
                await this.redis.del(key);
                return;
            }
            catch {
            }
        }
        this.inMemoryLocks.delete(key);
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = IdempotencyInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map