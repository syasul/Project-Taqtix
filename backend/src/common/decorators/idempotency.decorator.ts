import { SetMetadata } from '@nestjs/common';

export const REQUIRE_IDEMPOTENCY_KEY = 'REQUIRE_IDEMPOTENCY';

/**
 * Decorator untuk menandai endpoint yang wajib menyertakan header Idempotency-Key
 * guna mencegah spam klik dan mutasi data ganda (double booking, double transaction, dll).
 */
export const RequireIdempotency = () => SetMetadata(REQUIRE_IDEMPOTENCY_KEY, true);
