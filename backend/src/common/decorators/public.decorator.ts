import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator kustom untuk menandai endpoint agar dapat diakses tanpa login (publik).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
