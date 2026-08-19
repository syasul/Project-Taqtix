import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key untuk menyimpan data role pada endpoint.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator kustom untuk menetapkan batasan role akses pada controller / endpoint.
 * Contoh penggunaan: @Roles('organizer', 'admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
