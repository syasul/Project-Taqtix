"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_BANNERS = [
    {
        title: 'Jakarta Live Fest 2026',
        subtitle: 'Konser Spektakuler Musisi Terkemuka & Kolaborasi Lintas Genre',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&h=650&q=85',
        targetUrl: '/events',
        position: 'home_hero',
        order: 1,
        isActive: true,
    },
    {
        title: 'Indonesia Creative & Culinary Expo 2026',
        subtitle: 'Festival Kuliner Nusantara & Eksibisi Industri Kreatif Terbesar',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&h=650&q=85',
        targetUrl: '/events',
        position: 'home_hero',
        order: 2,
        isActive: true,
    },
    {
        title: 'Spiritual Return to Origin 2026',
        subtitle: 'Special Orchestral Performance & Immersive Visual Show',
        imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&h=650&q=85',
        targetUrl: '/events',
        position: 'home_hero',
        order: 3,
        isActive: true,
    },
    {
        title: 'Tawa Nusantara: Stand-Up Comedy Tour',
        subtitle: 'Tur Komedi Spesial Bersama Komika Ternama Indonesia',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&h=650&q=85',
        targetUrl: '/events',
        position: 'home_hero',
        order: 4,
        isActive: true,
    },
    {
        title: 'Jakarta Creative Workshop & Visual Art Expo',
        subtitle: 'Eksplorasi Kaligrafi Modern, Fotografi & Desain Visual',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&h=650&q=85',
        targetUrl: '/events',
        position: 'home_hero',
        order: 5,
        isActive: true,
    },
];
let BannersService = class BannersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicBanners(position = 'home_hero') {
        let banners = await this.prisma.banner.findMany({
            where: {
                isActive: true,
                ...(position ? { position } : {}),
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        if (banners.length === 0) {
            await this.prisma.banner.createMany({
                data: DEFAULT_BANNERS,
                skipDuplicates: true,
            });
            banners = await this.prisma.banner.findMany({
                where: {
                    isActive: true,
                    ...(position ? { position } : {}),
                },
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            });
        }
        return banners;
    }
    async getAdminBanners() {
        let banners = await this.prisma.banner.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        if (banners.length === 0) {
            await this.prisma.banner.createMany({
                data: DEFAULT_BANNERS,
                skipDuplicates: true,
            });
            banners = await this.prisma.banner.findMany({
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            });
        }
        return banners;
    }
    async createBanner(dto) {
        const order = dto.order ?? (await this.prisma.banner.count()) + 1;
        return this.prisma.banner.create({
            data: {
                title: dto.title.trim(),
                subtitle: dto.subtitle?.trim() || null,
                imageUrl: dto.imageUrl.trim(),
                targetUrl: dto.targetUrl?.trim() || null,
                position: dto.position?.trim() || 'home_hero',
                order,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }
    async updateBanner(id, dto) {
        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Banner dengan ID ${id} tidak ditemukan.`);
        }
        return this.prisma.banner.update({
            where: { id },
            data: {
                ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
                ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle?.trim() || null } : {}),
                ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl.trim() } : {}),
                ...(dto.targetUrl !== undefined ? { targetUrl: dto.targetUrl?.trim() || null } : {}),
                ...(dto.position !== undefined ? { position: dto.position.trim() } : {}),
                ...(dto.order !== undefined ? { order: dto.order } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            },
        });
    }
    async deleteBanner(id) {
        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Banner dengan ID ${id} tidak ditemukan.`);
        }
        await this.prisma.banner.delete({ where: { id } });
        return { id, message: 'Banner berhasil dihapus.' };
    }
};
exports.BannersService = BannersService;
exports.BannersService = BannersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BannersService);
//# sourceMappingURL=banners.service.js.map