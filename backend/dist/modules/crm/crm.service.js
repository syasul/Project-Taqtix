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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRMService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
let CRMService = class CRMService {
    prisma;
    broadcastQueue;
    constructor(prisma, broadcastQueue) {
        this.prisma = prisma;
        this.broadcastQueue = broadcastQueue;
    }
    async createSegment(eventId, name, criteria) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        return this.prisma.segment.create({
            data: {
                eventId,
                name,
                criteria,
            },
        });
    }
    async findSegments(eventId) {
        return this.prisma.segment.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findSegment(segmentId) {
        const segment = await this.prisma.segment.findUnique({
            where: { id: segmentId },
        });
        if (!segment) {
            throw new common_1.NotFoundException('Segmen tidak ditemukan');
        }
        return segment;
    }
    async getSegmentMembers(segmentId) {
        const segment = await this.findSegment(segmentId);
        const criteria = segment.criteria;
        const where = {
            order: {
                eventId: segment.eventId,
                status: 'PAID',
            },
        };
        if (criteria.ticketCategoryIds && criteria.ticketCategoryIds.length > 0) {
            where.ticketCategoryId = { in: criteria.ticketCategoryIds };
        }
        if (criteria.cities && criteria.cities.length > 0) {
            where.city = { in: criteria.cities };
        }
        if (criteria.previousEventIds && criteria.previousEventIds.length > 0) {
            const prevItems = await this.prisma.orderItem.findMany({
                where: {
                    order: {
                        eventId: { in: criteria.previousEventIds },
                        status: 'PAID',
                    },
                },
                select: { attendeeEmail: true },
            });
            const prevEmails = Array.from(new Set(prevItems.map((item) => item.attendeeEmail)));
            where.attendeeEmail = { in: prevEmails };
        }
        const orderItems = await this.prisma.orderItem.findMany({
            where,
            select: {
                attendeeName: true,
                attendeeEmail: true,
                attendeePhone: true,
                city: true,
                qty: true,
                ticketCategory: {
                    select: { name: true },
                },
            },
        });
        const buyerMap = new Map();
        for (const item of orderItems) {
            const email = item.attendeeEmail;
            if (!buyerMap.has(email)) {
                buyerMap.set(email, {
                    name: item.attendeeName,
                    email: item.attendeeEmail,
                    phone: item.attendeePhone,
                    city: item.city || 'Unknown',
                    qty: 0,
                    categories: new Set(),
                });
            }
            const buyer = buyerMap.get(email);
            buyer.qty += item.qty;
            buyer.categories.add(item.ticketCategory.name);
        }
        let buyers = Array.from(buyerMap.values()).map((b) => ({
            name: b.name,
            email: b.email,
            phone: b.phone,
            city: b.city,
            qty: b.qty,
            categories: Array.from(b.categories),
        }));
        if (criteria.minPurchaseCount) {
            buyers = buyers.filter((b) => b.qty >= criteria.minPurchaseCount);
        }
        return buyers;
    }
    async createBroadcast(segmentId, message, channel = 'whatsapp', subject) {
        const members = await this.getSegmentMembers(segmentId);
        const job = await this.prisma.broadcastJob.create({
            data: {
                segmentId,
                message: subject ? `[${subject}]\n\n${message}` : message,
                targetCount: members.length,
                status: 'queued',
            },
        });
        if (members.length === 0) {
            await this.prisma.broadcastJob.update({
                where: { id: job.id },
                data: { status: 'completed' },
            });
            return { jobId: job.id, targetCount: 0, status: 'completed' };
        }
        const recipientsData = members.map((m) => ({
            jobId: job.id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            status: 'pending',
        }));
        await this.prisma.broadcastRecipient.createMany({
            data: recipientsData,
        });
        const savedRecipients = await this.prisma.broadcastRecipient.findMany({
            where: { jobId: job.id },
        });
        const queueJobName = channel === 'email' ? 'send-email' : 'send-whatsapp';
        for (const rec of savedRecipients) {
            await this.broadcastQueue.add(queueJobName, {
                recipientId: rec.id,
                channel,
                subject: subject || 'Pemberitahuan Event',
                message,
            }, {
                jobId: `${job.id}_${rec.id}`,
            });
        }
        await this.prisma.broadcastJob.update({
            where: { id: job.id },
            data: { status: 'processing' },
        });
        return {
            jobId: job.id,
            channel,
            targetCount: members.length,
            status: 'processing',
        };
    }
    async getBroadcastStatus(jobId) {
        const job = await this.prisma.broadcastJob.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Broadcast job tidak ditemukan');
        }
        return {
            success: true,
            data: {
                jobId: job.id,
                status: job.status,
                targetCount: job.targetCount,
                sent: job.sentCount,
                failed: job.failedCount,
            },
        };
    }
};
exports.CRMService = CRMService;
exports.CRMService = CRMService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('broadcast')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue])
], CRMService);
//# sourceMappingURL=crm.service.js.map