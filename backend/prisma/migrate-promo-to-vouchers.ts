import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script: Pindahkan data promo code lama menjadi Voucher (Fase J).
 * Scoped ke event asalnya (eventId terisi).
 */
async function migratePromoCodesToVouchers() {
  console.log('[Migration] Memulai migrasi data PromoCode ke Voucher...');

  const promoCodes = await prisma.promoCode.findMany({
    include: {
      event: {
        select: {
          id: true,
          organizerId: true,
        },
      },
    },
  });

  console.log(`[Migration] Ditemukan ${promoCodes.length} promo code lama.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const promo of promoCodes) {
    if (!promo.event?.organizerId) {
      console.warn(`[Migration] Promo code ${promo.code} dilewati karena event tidak memiliki organizerId.`);
      skippedCount++;
      continue;
    }

    const existingVoucher = await prisma.voucher.findUnique({
      where: {
        organizerId_code: {
          organizerId: promo.event.organizerId,
          code: promo.code.toUpperCase(),
        },
      },
    });

    if (existingVoucher) {
      console.log(`[Migration] Voucher untuk kode ${promo.code} sudah ada. Melewati.`);
      skippedCount++;
      continue;
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 tahun dari sekarang

    await prisma.voucher.create({
      data: {
        organizerId: promo.event.organizerId,
        eventId: promo.eventId,
        code: promo.code.toUpperCase(),
        type: 'fixed',
        value: promo.discount,
        usageLimit: promo.maxUsage,
        usageCount: promo.usedCount,
        validFrom: promo.createdAt,
        validUntil,
        status: promo.usedCount >= promo.maxUsage ? 'inactive' : 'active',
      },
    });

    migratedCount++;
    console.log(`[Migration] Berhasil migrasi promo code ${promo.code} -> Voucher.`);
  }

  console.log(`[Migration] Selesai. Dimigrasi: ${migratedCount}, Dilewati: ${skippedCount}.`);
}

migratePromoCodesToVouchers()
  .catch((e) => {
    console.error('[Migration] Gagal menjalankan migrasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
