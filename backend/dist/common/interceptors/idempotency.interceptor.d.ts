import { NestInterceptor, ExecutionContext, CallHandler, OnModuleDestroy } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
export declare class IdempotencyInterceptor implements NestInterceptor, OnModuleDestroy {
    private readonly reflector;
    private readonly configService?;
    private readonly logger;
    private redis;
    private readonly inMemoryLocks;
    private readonly inMemoryCache;
    constructor(reflector: Reflector, configService?: ConfigService | undefined);
    onModuleDestroy(): Promise<void>;
    private initRedis;
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private getCachedResult;
    private setCachedResult;
    private acquireLock;
    private releaseLock;
}
