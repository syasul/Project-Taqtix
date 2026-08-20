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
            status: client_1.EventStatus.PUBLISHED,
        },
    });
    console.log('Membuat kategori tiket...');
    await prisma.ticketCategory.createMany({
        data: [
            {
                eventId: event.id,
                name: 'Early Bird',
                price: 100000,
                quota: 100,
                sold: 0,
                saleStartAt: new Date('2026-08-01T00:00:00Z'),
                saleEndAt: new Date('2026-08-15T23:59:59Z'),
            },
            {
                eventId: event.id,
                name: 'Regular Ticket',
                price: 150000,
                quota: 500,
                sold: 0,
                saleStartAt: new Date('2026-08-16T00:00:00Z'),
                saleEndAt: new Date('2026-09-10T23:59:59Z'),
            },
            {
                eventId: event.id,
                name: 'VIP Experience',
                price: 350000,
                quota: 50,
                sold: 0,
                saleStartAt: new Date('2026-08-16T00:00:00Z'),
                saleEndAt: new Date('2026-09-10T23:59:59Z'),
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
//# sourceMappingURL=seed.js.map