import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modul Prisma didekorasi sebagai @Global agar PrismaService
 * dapat diimpor langsung tanpa harus mendefinisikannya di setiap modul lain.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
