import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lineupDataBySlug: Record<
  string,
  Array<{
    name: string;
    photoUrl: string;
    performTime: string;
    stage: string;
    socialUrl: string;
  }>
> = {
  'kajian-akbar-digital-hidayah': [
    {
      name: 'Ustadz Dr. Firanda Andirja, Lc., M.A.',
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      performTime: '08:30 - 10:00 WIB',
      stage: 'Panggung Utama Masjid Istiqlal',
      socialUrl: 'https://instagram.com/firanda_andirja_official',
    },
    {
      name: 'Ustadz Muhammad Nuzul Dzikri, Lc.',
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      performTime: '10:15 - 11:30 WIB',
      stage: 'Panggung Utama Masjid Istiqlal',
      socialUrl: 'https://instagram.com/muhammadnuzuldzikri',
    },
    {
      name: 'Ustadz Adi Hidayat, Lc., M.A.',
      photoUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      performTime: '11:30 - 12:30 WIB',
      stage: 'Panggung Utama Masjid Istiqlal',
      socialUrl: 'https://instagram.com/adihidayatofficial',
    },
  ],
  'fest-hijrah-halal-culinary-2026': [
    {
      name: 'Ustadz Felix Siauw',
      photoUrl:
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop',
      performTime: '13:00 - 15:00 WIB',
      stage: 'Main Hall ICE BSD',
      socialUrl: 'https://instagram.com/felixsiauw',
    },
    {
      name: 'Taqy Malik',
      photoUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
      performTime: '15:30 - 17:00 WIB',
      stage: 'Culinary Expo Stage',
      socialUrl: 'https://instagram.com/taqy_malik',
    },
    {
      name: 'Opick Tombo Ati',
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 21:00 WIB',
      stage: 'Charity Concert Stage',
      socialUrl: 'https://instagram.com/opick_tomboati',
    },
  ],
  'simfoni-sholawat-nusantara': [
    {
      name: 'Habib Syech bin Abdul Qodir Assegaf',
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 21:00 WIB',
      stage: 'Teater Besar Grand Stage',
      socialUrl: 'https://instagram.com/syaikhassegaf',
    },
    {
      name: 'Veve Zulfikar Basyaiban',
      photoUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
      performTime: '21:00 - 21:45 WIB',
      stage: 'Teater Besar Grand Stage',
      socialUrl: 'https://instagram.com/veve_zulfikar',
    },
    {
      name: 'Ahbaabul Musthofa Ensemble',
      photoUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 22:30 WIB',
      stage: 'Pit Orchestra TIM',
      socialUrl: 'https://instagram.com/ahbaabulmusthofa_official',
    },
  ],
};

async function main() {
  console.log('Seeding lineup data for events...');

  for (const [slug, items] of Object.entries(lineupDataBySlug)) {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: { lineup: true },
    });

    if (!event) {
      console.log(`Event with slug "${slug}" not found, skipping.`);
      continue;
    }

    if (event.lineup.length > 0) {
      console.log(`Event "${event.title}" already has ${event.lineup.length} lineup items, updating/skipping.`);
      continue;
    }

    console.log(`Adding ${items.length} lineup items for event "${event.title}"...`);
    await prisma.lineUpItem.createMany({
      data: items.map((item, index) => ({
        eventId: event.id,
        name: item.name,
        photoUrl: item.photoUrl,
        performTime: item.performTime,
        stage: item.stage,
        socialUrl: item.socialUrl,
        order: index,
      })),
    });
    console.log(`Successfully added lineup for "${event.title}"!`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding lineup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
