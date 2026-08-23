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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateOrganizerSegmentAndPlan(organizerId, dto) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { id: organizerId },
        });
        if (!organizer) {
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        }
        return this.prisma.organizer.update({
            where: { id: organizerId },
            data: {
                segment: dto.segment ?? organizer.segment,
                plan: dto.plan ?? organizer.plan,
                planStartedAt: dto.plan ? new Date() : organizer.planStartedAt,
                planExpiresAt: dto.planExpiresAt ? new Date(dto.planExpiresAt) : organizer.planExpiresAt,
            },
        });
    }
    async createLead(dto) {
        return this.prisma.enterpriseLead.create({
            data: {
                name: dto.name,
                organizationName: dto.organizationName,
                email: dto.email,
                phone: dto.phone,
                message: dto.message,
                status: 'new',
            },
        });
    }
    async getLeads() {
        return this.prisma.enterpriseLead.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateLeadStatus(leadId, status) {
        const lead = await this.prisma.enterpriseLead.findUnique({
            where: { id: leadId },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead tidak ditemukan');
        }
        return this.prisma.enterpriseLead.update({
            where: { id: leadId },
            data: { status },
        });
    }
    async assignLead(leadId, adminId) {
        const lead = await this.prisma.enterpriseLead.findUnique({
            where: { id: leadId },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead tidak ditemukan');
        }
        return this.prisma.enterpriseLead.update({
            where: { id: leadId },
            data: { assignedTo: adminId },
        });
    }
    async getBillingOversight() {
        const organizers = await this.prisma.organizer.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return organizers.map((org) => {
            const now = new Date();
            let status = 'active';
            if (org.planExpiresAt && org.planExpiresAt < now) {
                status = 'expired';
            }
            return {
                id: org.id,
                name: org.name,
                email: org.user.email,
                plan: org.plan,
                segment: org.segment || 'event_builder',
                status,
                planStartedAt: org.planStartedAt,
                planExpiresAt: org.planExpiresAt,
            };
        });
    }
    async getPartnersOversight() {
        return this.prisma.partner.findMany({
            include: {
                event: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: { revenueGenerated: 'desc' },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map