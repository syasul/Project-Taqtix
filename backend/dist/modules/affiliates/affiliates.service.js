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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const crypto = __importStar(require("crypto"));
let AffiliatesService = class AffiliatesService {
    prisma;
    configService;
    authService;
    constructor(prisma, configService, authService) {
        this.prisma = prisma;
        this.configService = configService;
        this.authService = authService;
    }
    async verifyEventOwnership(eventId, organizerUserId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId: organizerUserId, status: 'active' },
        });
        let organizerId = member?.organizerId;
        if (!organizerId) {
            const organizer = await this.prisma.organizer.findUnique({
                where: { userId: organizerUserId },
            });
            if (!organizer) {
                throw new common_1.ForbiddenException('Akses ditolak: Anda bukan organizer');
            }
            organizerId = organizer.id;
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizerId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
    }
    async create(eventId, dto, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        const randomSuffix = Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();
        const cleanName = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueCode = `${cleanName}-${randomSuffix}`;
        if (dto.email) {
            const existingPartner = await this.prisma.partner.findUnique({
                where: { email: dto.email },
            });
            if (existingPartner) {
                throw new common_1.ConflictException('Email partner sudah terdaftar');
            }
        }
        return this.prisma.partner.create({
            data: {
                eventId,
                name: dto.name,
                type: dto.type,
                uniqueCode,
                promoCode: dto.promoCode || null,
                commissionType: 'percentage',
                commissionValue: dto.commissionPct ?? 10,
                email: dto.email || null,
            },
        });
    }
    async registerClickAndGetUrl(code, ipAddress, userAgent) {
        const partner = await this.prisma.partner.findUnique({
            where: { uniqueCode: code },
            include: { event: true },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Partner afiliasi tidak ditemukan');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.partner.update({
                where: { id: partner.id },
                data: {
                    clicks: { increment: 1 },
                },
            });
            const ipHash = crypto
                .createHash('sha256')
                .update(ipAddress || 'unknown')
                .digest('hex');
            await tx.click.create({
                data: {
                    partnerId: partner.id,
                    ipHash,
                },
            });
        });
        const frontendUrl = this.configService.get('TAQTIX_FRONTEND_URL') ||
            'http://localhost:3000';
        return `${frontendUrl}/events/${partner.event.slug}?aff=${code}`;
    }
    async findAll(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        return this.prisma.partner.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getLeaderboard(eventId, organizerUserId) {
        await this.verifyEventOwnership(eventId, organizerUserId);
        return this.prisma.partner.findMany({
            where: { eventId },
            orderBy: [{ conversions: 'desc' }, { commissionEarned: 'desc' }],
        });
    }
    async requestMagicLink(email) {
        const partner = await this.prisma.partner.findUnique({
            where: { email },
        });
        if (!partner) {
            throw new common_1.NotFoundException('EMAIL_NOT_REGISTERED');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.partnerMagicLink.deleteMany({
            where: { email },
        });
        await this.prisma.partnerMagicLink.create({
            data: {
                email,
                token,
                expiresAt,
            },
        });
        console.log(`[PARTNER PORTAL MAGIC LINK]: http://localhost:3000/partner/verify?token=${token}`);
        return { success: true, token };
    }
    async verifyMagicLink(token) {
        const magicLink = await this.prisma.partnerMagicLink.findUnique({
            where: { token },
        });
        if (!magicLink) {
            throw new common_1.NotFoundException('Token magic link tidak valid');
        }
        if (magicLink.expiresAt < new Date()) {
            throw new common_1.GoneException('Token magic link kedaluwarsa');
        }
        const partner = await this.prisma.partner.findUnique({
            where: { email: magicLink.email },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Akun partner tidak ditemukan');
        }
        await this.prisma.partner.update({
            where: { id: partner.id },
            data: { lastLoginAt: new Date() },
        });
        await this.prisma.partnerMagicLink.delete({
            where: { id: magicLink.id },
        });
        return this.authService.generateTokenPair(partner.id, partner.email || '', 'partner');
    }
    async getPartnerStats(partnerId) {
        const partner = await this.prisma.partner.findUnique({
            where: { id: partnerId },
            include: {
                event: {
                    select: {
                        title: true,
                        slug: true,
                        startDate: true,
                    },
                },
            },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Partner tidak ditemukan');
        }
        const recentOrders = await this.prisma.order.findMany({
            where: {
                partnerId,
                status: 'PAID',
            },
            select: {
                id: true,
                totalAmount: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });
        const recentSales = recentOrders.map((o) => ({
            orderId: o.id,
            amount: o.totalAmount,
            date: o.createdAt,
        }));
        return {
            partnerId: partner.id,
            name: partner.name,
            uniqueCode: partner.uniqueCode,
            eventName: partner.event.title,
            eventSlug: partner.event.slug,
            clicks: partner.clicks,
            conversions: partner.conversions,
            revenueGenerated: partner.revenueGenerated,
            commissionEarned: partner.commissionEarned,
            commissionPct: partner.commissionValue,
            recentSales,
        };
    }
};
exports.AffiliatesService = AffiliatesService;
exports.AffiliatesService = AffiliatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        auth_service_1.AuthService])
], AffiliatesService);
//# sourceMappingURL=affiliates.service.js.map