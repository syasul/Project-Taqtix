import { PrismaClient, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding data awal...');

  // 1. Bersihkan database
  console.log('Membersihkan database...');
  await prisma.click.deleteMany();
  await prisma.affiliatePartner.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat User Organizer
  console.log('Membuat user organizer...');
  const organizerEmail = 'organizer@taqtix.id';
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: organizerEmail,
      passwordHash: hashedPassword,
      role: 'organizer',
    },
  });

  // 3. Buat Profil Organizer
  console.log('Membuat profil organizer...');
  const organizer = await prisma.organizer.create({
    data: {
      userId: user.id,
      name: 'Taqwa Media Group',
      slug: 'taqwa-media-group',
      bankAccount: 'Bank Syariah Indonesia (BSI) - 7123456789 a.n Taqwa Media',
    },
  });

  // 4. Buat Event Taqwa Movement
  console.log('Membuat event...');
  const event = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      title: 'Taqwa Movement Concert 2026',
      slug: 'taqwa-movement-2026',
      description: 'Stress test pertama untuk engine ticketing TAQtix. Pintu gerbang kebangkitan event religi modern.',
      location: 'Jakarta Convention Center, Senayan, Jakarta',
      startDate: new Date('2026-09-12T13:00:00Z'),
      endDate: new Date('2026-09-12T22:00:00Z'),
      status: EventStatus.PUBLISHED,
    },
  });

  // 5. Buat Kategori Tiket
  console.log('Membuat kategori tiket...');
  await prisma.ticketType.createMany({
    data: [
      {
        eventId: event.id,
        name: 'Early Bird',
        price: 100000,
        quota: 100,
        soldCount: 0,
        saleStart: new Date('2026-08-01T00:00:00Z'),
        saleEnd: new Date('2026-08-15T23:59:59Z'),
      },
      {
        eventId: event.id,
        name: 'Regular Ticket',
        price: 150000,
        quota: 500,
        soldCount: 0,
        saleStart: new Date('2026-08-16T00:00:00Z'),
        saleEnd: new Date('2026-09-10T23:59:59Z'),
      },
      {
        eventId: event.id,
        name: 'VIP Experience',
        price: 350000,
        quota: 50,
        soldCount: 0,
        saleStart: new Date('2026-08-16T00:00:00Z'),
        saleEnd: new Date('2026-09-10T23:59:59Z'),
      },
    ],
  });

  console.log('Seeding selesai dengan sukses!');
  console.log('Detail Akun Organizer:');
  console.log(`Email: ${organizerEmail}`);
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('Error saat proses seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
