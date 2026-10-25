/**
 * Script CLI untuk mereset kata sandi pengguna atau membuat akun organizer jika belum ada.
 * 
 * Penggunaan:
 *   node scripts/reset-user-password.js <email> <password_baru> [role]
 * 
 * Contoh:
 *   node scripts/reset-user-password.js abbiyumanagement@gmail.com Rahasia123 organizer
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const emailArg = process.argv[2];
const newPasswordArg = process.argv[3];
const roleArg = process.argv[4] || 'organizer';

if (!emailArg || !newPasswordArg) {
  console.error('\n❌ Format salah!');
  console.log('Gunakan: node scripts/reset-user-password.js <email> <password_baru> [role]');
  console.log('Contoh:  node scripts/reset-user-password.js abbiyumanagement@gmail.com Password123 organizer\n');
  process.exit(1);
}

const cleanEmail = emailArg.trim().toLowerCase();
const prisma = new PrismaClient();

async function main() {
  console.log(`\n🔍 Memeriksa akun: ${cleanEmail}...`);

  let user = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: 'insensitive' } },
  });

  const hashedPassword = await bcrypt.hash(newPasswordArg, 10);

  if (!user) {
    console.log(`⚠️ Akun tidak ditemukan. Membuat akun baru dengan role: ${roleArg}...`);
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: hashedPassword,
        role: roleArg,
      },
    });
    console.log(`✅ Akun baru berhasil dibuat dengan ID: ${user.id}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });
    console.log(`✅ Kata sandi untuk ${cleanEmail} berhasil diperbarui!`);
  }

  // Jika role adalah organizer, pastikan profil Organizer ada
  if (user.role === 'organizer' || roleArg === 'organizer') {
    const existingOrg = await prisma.organizer.findFirst({
      where: { userId: user.id },
    });

    if (!existingOrg) {
      const baseSlug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.organizer.create({
        data: {
          userId: user.id,
          name: cleanEmail.split('@')[0],
          slug,
          status: 'active',
        },
      });
      console.log(`✅ Profil Organizer berhasil dibuat (Slug: ${slug}, Status: active)`);
    } else {
      console.log(`ℹ️ Profil Organizer terhubung: "${existingOrg.name}" (Status: ${existingOrg.status})`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 AKUN SIAP DIGUNAKAN UNTUK LOGIN:');
  console.log(`   Email:        ${cleanEmail}`);
  console.log(`   Kata Sandi:   ${newPasswordArg}`);
  console.log(`   Role:         ${user.role}`);
  console.log('======================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Terjadi kesalahan:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
