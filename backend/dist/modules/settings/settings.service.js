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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerId(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
        });
        if (member)
            return member.organizerId;
        const org = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!org) {
            throw new common_1.ForbiddenException('Profil organizer tidak ditemukan');
        }
        return org.id;
    }
    async getOrganization(userId) {
        const organizerId = await this.getOrganizerId(userId);
        const org = await this.prisma.organizer.findUnique({
            where: { id: organizerId },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                contactEmail: true,
                phone: true,
            },
        });
        if (!org)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        return org;
    }
    async updateOrganization(userId, data) {
        const organizerId = await this.getOrganizerId(userId);
        const updated = await this.prisma.organizer.update({
            where: { id: organizerId },
            data: {
                ...(data.name ? { name: data.name } : {}),
                ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
                ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                contactEmail: true,
                phone: true,
            },
        });
        return updated;
    }
    async getPayment(userId) {
        const organizerId = await this.getOrganizerId(userId);
        const org = await this.prisma.organizer.findUnique({
            where: { id: organizerId },
            select: {
                id: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
            },
        });
        if (!org)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        return {
            bankName: org.bankName || '',
            bankAccountNumber: org.bankAccountNumber || '',
            bankAccountHolder: org.bankAccountHolder || '',
        };
    }
    async updatePayment(userId, data) {
        const organizerId = await this.getOrganizerId(userId);
        const updated = await this.prisma.organizer.update({
            where: { id: organizerId },
            data: {
                ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
                ...(data.bankAccountNumber !== undefined ? { bankAccountNumber: data.bankAccountNumber } : {}),
                ...(data.bankAccountHolder !== undefined ? { bankAccountHolder: data.bankAccountHolder } : {}),
            },
            select: {
                bankName: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
            },
        });
        return updated;
    }
    async getIntegrations(userId) {
        const organizerId = await this.getOrganizerId(userId);
        const org = await this.prisma.organizer.findUnique({
            where: { id: organizerId },
            select: {
                integrations: true,
            },
        });
        if (!org)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        const integrations = org.integrations || {};
        return {
            metaPixelId: integrations.metaPixelId || '',
            tiktokPixelId: integrations.tiktokPixelId || '',
            gaTrackingId: integrations.gaTrackingId || '',
        };
    }
    async updateIntegrations(userId, data) {
        const organizerId = await this.getOrganizerId(userId);
        const updated = await this.prisma.organizer.update({
            where: { id: organizerId },
            data: {
                integrations: {
                    metaPixelId: data.metaPixelId || '',
                    tiktokPixelId: data.tiktokPixelId || '',
                    gaTrackingId: data.gaTrackingId || '',
                },
            },
            select: {
                integrations: true,
            },
        });
        return updated.integrations;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map