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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settlements_service_1 = require("../settlements/settlements.service");
const bcrypt = __importStar(require("bcrypt"));
let AdminService = class AdminService {
    prisma;
    settlementsService;
    constructor(prisma, settlementsService) {
        this.prisma = prisma;
        this.settlementsService = settlementsService;
    }
    async getOrganizers() {
        const orgs = await this.prisma.organizer.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
                _count: {
                    select: {
                        events: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            email: o.user.email,
            phone: o.phone || '08123456789',
            status: o.status || 'pending',
            plan: o.plan,
            segment: o.segment,
            bankAccount: o.bankAccount,
            createdAt: o.createdAt.toISOString(),
            approvedAt: o.approvedAt ? o.approvedAt.toISOString() : null,
            approvedBy: o.approvedBy || null,
            eventCount: o._count.events,
        }));
    }
    async createOrganizer(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email sudah terdaftar dalam sistem.');
        }
        const password = dto.password || 'Taqtix2026!';
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                role: 'organizer',
            },
        });
        const slug = dto.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;
        const organizer = await this.prisma.organizer.create({
            data: {
                userId: user.id,
                name: dto.name,
                slug,
                segment: dto.segment || 'event_builder',
                plan: dto.plan || 'starter',
                bankAccount: dto.bankAccount || '',
            },
        });
        return {
            id: organizer.id,
            name: organizer.name,
            email: user.email,
            slug: organizer.slug,
            plan: organizer.plan,
            segment: organizer.segment,
            bankAccount: organizer.bankAccount,
            status: 'active',
            createdAt: organizer.createdAt.toISOString(),
            eventCount: 0,
        };
    }
    async deleteOrganizer(id) {
        const org = await this.prisma.organizer.findUnique({
            where: { id },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        }
        await this.prisma.organizer.delete({
            where: { id },
        });
        await this.prisma.user.delete({
            where: { id: org.userId },
        }).catch(() => { });
        return { id, message: 'Organizer berhasil dihapus' };
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
                name: dto.name ?? organizer.name,
                segment: dto.segment ?? organizer.segment,
                plan: dto.plan ?? organizer.plan,
                bankAccount: dto.bankAccount ?? organizer.bankAccount,
                planStartedAt: dto.plan ? new Date() : organizer.planStartedAt,
                planExpiresAt: dto.planExpiresAt ? new Date(dto.planExpiresAt) : organizer.planExpiresAt,
            },
        });
    }
    async createPartner(dto) {
        let passwordHash = undefined;
        if (dto.password) {
            passwordHash = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.partner.create({
            data: {
                eventId: dto.eventId,
                name: dto.name,
                type: dto.type || 'COMMUNITY',
                uniqueCode: dto.uniqueCode.toUpperCase(),
                promoCode: dto.promoCode ? dto.promoCode.toUpperCase() : null,
                commissionType: dto.commissionType || 'percentage',
                commissionValue: dto.commissionValue ?? 10.0,
                email: dto.email || null,
                passwordHash,
            },
            include: {
                event: {
                    select: {
                        title: true,
                    },
                },
            },
        });
    }
    async updatePartner(partnerId, dto) {
        const partner = await this.prisma.partner.findUnique({
            where: { id: partnerId },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Partner tidak ditemukan');
        }
        return this.prisma.partner.update({
            where: { id: partnerId },
            data: {
                name: dto.name ?? partner.name,
                eventId: dto.eventId ?? partner.eventId,
                type: dto.type ?? partner.type,
                uniqueCode: dto.uniqueCode ? dto.uniqueCode.toUpperCase() : partner.uniqueCode,
                promoCode: dto.promoCode !== undefined ? dto.promoCode?.toUpperCase() : partner.promoCode,
                commissionType: dto.commissionType ?? partner.commissionType,
                commissionValue: dto.commissionValue ?? partner.commissionValue,
                email: dto.email ?? partner.email,
            },
            include: {
                event: {
                    select: {
                        title: true,
                    },
                },
            },
        });
    }
    async deletePartner(id) {
        const p = await this.prisma.partner.findUnique({
            where: { id },
        });
        if (!p) {
            throw new common_1.NotFoundException('Partner tidak ditemukan');
        }
        await this.prisma.partner.delete({
            where: { id },
        });
        return { id, message: 'Partner berhasil dihapus' };
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
    async getEvents() {
        const events = await this.prisma.event.findMany({
            include: {
                organizer: true,
                ticketCategories: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return events.map((e) => ({
            id: e.id,
            title: e.title,
            slug: e.slug,
            organizerName: e.organizer.name,
            location: e.location,
            status: e.status.toLowerCase(),
            startDate: e.startDate.toISOString(),
            endDate: e.endDate.toISOString(),
            ticketsSold: e.ticketCategories.reduce((s, tc) => s + tc.sold, 0),
            quota: e.ticketCategories.reduce((s, tc) => s + tc.quota, 0),
        }));
    }
    async approveEvent(eventId) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Event tidak ditemukan');
        return this.prisma.event.update({
            where: { id: eventId },
            data: { status: 'PUBLISHED' },
        });
    }
    async rejectEvent(eventId, reason) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Event tidak ditemukan');
        return this.prisma.event.update({
            where: { id: eventId },
            data: { status: 'CANCELLED' },
        });
    }
    async getDashboard() {
        const [totalOrganizers, activeOrganizers, totalEvents, publishedEvents, paidOrders] = await Promise.all([
            this.prisma.organizer.count(),
            this.prisma.organizer.count({ where: { status: 'active' } }),
            this.prisma.event.count(),
            this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.order.findMany({
                where: { status: 'PAID' },
                select: { totalAmount: true },
            }),
        ]);
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const platformFee = Math.round(totalRevenue * 0.05);
        return {
            totalOrganizers,
            activeOrganizers,
            totalEvents,
            publishedEvents,
            totalRevenue,
            platformFee,
        };
    }
    async getOrganizerById(id) {
        const o = await this.prisma.organizer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
                events: {
                    include: {
                        ticketCategories: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!o)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            email: o.user.email,
            phone: o.phone || '08123456789',
            status: o.status || 'pending',
            plan: o.plan,
            segment: o.segment,
            bankAccount: o.bankAccount,
            createdAt: o.createdAt.toISOString(),
            approvedAt: o.approvedAt ? o.approvedAt.toISOString() : null,
            approvedBy: o.approvedBy || null,
            events: o.events.map((e) => ({
                id: e.id,
                title: e.title,
                slug: e.slug,
                status: e.status.toLowerCase(),
                location: e.location,
                startDate: e.startDate.toISOString(),
                endDate: e.endDate.toISOString(),
                ticketsSold: e.ticketCategories.reduce((s, tc) => s + tc.sold, 0),
                quota: e.ticketCategories.reduce((s, tc) => s + tc.quota, 0),
            })),
        };
    }
    async approveOrganizer(id, adminId) {
        const organizer = await this.prisma.organizer.findUnique({ where: { id } });
        if (!organizer)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        const updated = await this.prisma.organizer.update({
            where: { id },
            data: {
                status: 'active',
                approvedAt: new Date(),
                approvedBy: adminId || 'admin',
            },
        });
        await this.recordAuditLog(adminId || 'admin', 'approve_organizer', id, 'organizer', { organizerName: organizer.name, previousStatus: organizer.status });
        return updated;
    }
    async suspendOrganizer(id, adminId) {
        const organizer = await this.prisma.organizer.findUnique({ where: { id } });
        if (!organizer)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        const updated = await this.prisma.organizer.update({
            where: { id },
            data: {
                status: 'suspended',
            },
        });
        await this.recordAuditLog(adminId || 'admin', 'suspend_organizer', id, 'organizer', { organizerName: organizer.name, previousStatus: organizer.status });
        return updated;
    }
    async updatePlan(id, plan, adminId) {
        const organizer = await this.prisma.organizer.findUnique({ where: { id } });
        if (!organizer)
            throw new common_1.NotFoundException('Organizer tidak ditemukan');
        const updated = await this.prisma.organizer.update({
            where: { id },
            data: {
                plan,
                planStartedAt: new Date(),
            },
        });
        await this.recordAuditLog(adminId || 'admin', 'change_plan', id, 'organizer', { previousPlan: organizer.plan, newPlan: plan });
        return updated;
    }
    async forceUnpublishEvent(id, adminId) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event tidak ditemukan');
        const updated = await this.prisma.event.update({
            where: { id },
            data: {
                status: 'DRAFT',
            },
        });
        await this.recordAuditLog(adminId || 'admin', 'force_unpublish', id, 'event', { eventTitle: event.title, previousStatus: event.status });
        return updated;
    }
    async searchOrders(query) {
        const where = {};
        if (query) {
            where.OR = [
                { id: { contains: query, mode: 'insensitive' } },
                { buyer: { email: { contains: query, mode: 'insensitive' } } },
                { orderItems: { some: { attendeeName: { contains: query, mode: 'insensitive' } } } },
            ];
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: {
                buyer: { select: { email: true } },
                event: { select: { id: true, title: true, organizer: { select: { name: true } } } },
                orderItems: { include: { ticketCategory: true } },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return orders.map((o) => ({
            id: o.id,
            eventId: o.eventId,
            eventTitle: o.event.title,
            organizerName: o.event.organizer.name,
            buyerEmail: o.buyer.email,
            status: o.status.toLowerCase(),
            totalAmount: o.totalAmount,
            promoCode: o.promoCodeId,
            createdAt: o.createdAt.toISOString(),
            items: o.orderItems.map((it) => ({
                categoryName: it.ticketCategory.name,
                qty: it.qty,
                attendeeName: it.attendeeName,
                attendeePhone: it.attendeePhone,
            })),
        }));
    }
    async calculateSettlements() {
        return this.settlementsService.calculatePendingSettlements();
    }
    async getSettlements() {
        return this.settlementsService.getSettlements();
    }
    async markSettlementPaid(id, adminId) {
        return this.settlementsService.markSettlementPaid(id, adminId || 'admin');
    }
    async getAuditLogs() {
        return this.prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
    }
    async recordAuditLog(adminId, action, targetId, targetType, details) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    adminId,
                    action,
                    targetId,
                    targetType,
                    details: details || null,
                },
            });
        }
        catch (err) {
            console.error('Gagal mencatat audit log:', err);
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settlements_service_1.SettlementsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map