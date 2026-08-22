"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Memulai proses seeding data awal...');
    console.log('Membersihkan database...');
    await prisma.click.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.ticketCategory.deleteMany();
    await prisma.event.deleteMany();
    await prisma.organizer.deleteMany();
    await prisma.user.deleteMany();
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
    console.log('Membuat profil organizer...');
    const organizer = await prisma.organizer.create({
        data: {
            userId: user.id,
            name: 'Taqwa Media Group',
            slug: 'taqwa-media-group',
            bankAccount: 'Bank Syariah Indonesia (BSI) - 7123456789 a.n Taqwa Media',
        },
    });
    console.log('Membuat user gate staff...');
    const staffEmail = 'staff@taqtix.id';
    const staffUser = await prisma.user.create({
        data: {
            email: staffEmail,
            passwordHash: hashedPassword,
            role: 'gate_staff',
        },
    });
    console.log('Membuat event...');
    const eventsData = [
        {
            title: 'Taqwa Movement Concert 2026',
            slug: 'taqwa-movement-2026',
            description: 'Konser religi terbesar tahun ini menghadirkan musisi islami terkemuka dan pesan kebangkitan umat.',
            location: 'Jakarta Convention Center, Senayan, Jakarta',
            startDate: new Date('2026-09-12T13:00:00Z'),
            endDate: new Date('2026-09-12T22:00:00Z'),
            status: client_1.EventStatus.PUBLISHED,
            categories: [
                { name: 'Early Bird', price: 100000, quota: 100 },
                { name: 'Regular Ticket', price: 150000, quota: 500 },
                { name: 'VIP Experience', price: 350000, quota: 50 },
            ]
        },
        {
            title: 'Kajian Akbar: Menjemput Hidayah di Era Digital',
            slug: 'kajian-akbar-digital-hidayah',
            description: 'Kupas tuntas tantangan menjaga iman dan adab di tengah derasnya arus informasi dunia maya bersama asatidz nasional.',
            location: 'Masjid Istiqlal, Jakarta Pusat',
            startDate: new Date('2026-10-04T08:00:00Z'),
            endDate: new Date('2026-10-04T12:00:00Z'),
            status: client_1.EventStatus.PUBLISHED,
            categories: [
                { name: 'Infaq Dakwah - Regular', price: 25000, quota: 1000 },
                { name: 'Infaq Dakwah - Prioritas', price: 75000, quota: 200 },
            ]
        },
        {
            title: 'Fest Hijrah & Halal Culinary 2026',
            slug: 'fest-hijrah-halal-culinary-2026',
            description: 'Festival kuliner halal, pameran produk syariah, talkshow interaktif, dan konser amal dalam satu tempat.',
            location: 'ICE BSD Hall 5-6, Tangerang',
            startDate: new Date('2026-11-20T10:00:00Z'),
            endDate: new Date('2026-11-22T22:00:00Z'),
            status: client_1.EventStatus.PUBLISHED,
            categories: [
                { name: 'Tiket Masuk Harian', price: 50000, quota: 3000 },
                { name: '3-Day Pass (Terusan)', price: 120000, quota: 1000 },
            ]
        },
        {
            title: 'Simfoni Sholawat Nusantara',
            slug: 'simfoni-sholawat-nusantara',
            description: 'Harmonisasi sholawat dengan balutan orchestra megah, merayakan kecintaan pada baginda Rasulullah SAW.',
            location: 'Teater Besar Taman Ismail Marzuki, Jakarta',
            startDate: new Date('2026-12-05T19:30:00Z'),
            endDate: new Date('2026-12-05T22:30:00Z'),
            status: client_1.EventStatus.PUBLISHED,
            categories: [
                { name: 'Bronze', price: 150000, quota: 150 },
                { name: 'Silver', price: 250000, quota: 200 },
                { name: 'Gold', price: 400000, quota: 100 },
                { name: 'Platinum VIP', price: 750000, quota: 50 },
            ]
        },
        {
            title: 'Workshop: Content Creator Muslim Profesional',
            slug: 'workshop-content-creator-muslim',
            description: 'Belajar cara memproduksi konten kreatif, berkualitas, dan bernilai dakwah yang menarik generasi Z.',
            location: 'Taqwa Space Coworking, Tebet, Jakarta Selatan',
            startDate: new Date('2026-09-26T09:00:00Z'),
            endDate: new Date('2026-09-26T16:00:00Z'),
            status: client_1.EventStatus.PUBLISHED,
            categories: [
                { name: 'General Admission', price: 200000, quota: 60 },
                { name: 'VIP Mentoring Pack', price: 500000, quota: 15 },
            ]
        }
    ];
    for (const e of eventsData) {
        const createdEvent = await prisma.event.create({
            data: {
                organizerId: organizer.id,
                title: e.title,
                slug: e.slug,
                description: e.description,
                location: e.location,
                startDate: e.startDate,
                endDate: e.endDate,
                status: e.status,
            }
        });
        await prisma.ticketCategory.createMany({
            data: e.categories.map((cat) => ({
                eventId: createdEvent.id,
                name: cat.name,
                price: cat.price,
                quota: cat.quota,
                sold: 0,
                saleStartAt: new Date('2026-08-01T00:00:00Z'),
                saleEndAt: new Date(e.startDate.getTime() - 24 * 60 * 60 * 1000),
            }))
        });
        await prisma.gateStaff.create({
            data: {
                eventId: createdEvent.id,
                userId: staffUser.id,
                gateName: 'Pintu Utama',
            }
        });
    }
    console.log('Seeding selesai dengan sukses!');
    console.log('Detail Akun Organizer:');
    console.log(`Email: ${organizerEmail}`);
    console.log('Password: password123');
    console.log('Detail Akun Gate Staff:');
    console.log(`Email: ${staffEmail}`);
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
//# sourceMappingURL=seed.js.map