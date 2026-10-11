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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let TicketsService = class TicketsService {
    prisma;
    notificationsQueue;
    configService;
    constructor(prisma, notificationsQueue, configService) {
        this.prisma = prisma;
        this.notificationsQueue = notificationsQueue;
        this.configService = configService;
    }
    async verifyEventOwnership(eventId, userId) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan organizer');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.organizerId !== organizer.id) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik event ini');
        }
    }
    async createCategory(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.ticketCategory.create({
            data: {
                eventId,
                name: dto.name,
                price: dto.price,
                quota: dto.quota,
                saleStartAt: new Date(dto.saleStart),
                saleEndAt: new Date(dto.saleEnd),
            },
        });
    }
    async updateCategory(id, dto, userId) {
        const ticketCategory = await this.prisma.ticketCategory.findUnique({
            where: { id },
        });
        if (!ticketCategory) {
            throw new common_1.NotFoundException('Kategori tiket tidak ditemukan');
        }
        await this.verifyEventOwnership(ticketCategory.eventId, userId);
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.price !== undefined)
            updateData.price = dto.price;
        if (dto.quota !== undefined)
            updateData.quota = dto.quota;
        if (dto.saleStart !== undefined)
            updateData.saleStartAt = new Date(dto.saleStart);
        if (dto.saleEnd !== undefined)
            updateData.saleEndAt = new Date(dto.saleEnd);
        return this.prisma.ticketCategory.update({
            where: { id },
            data: updateData,
        });
    }
    async getCategories(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        return this.prisma.ticketCategory.findMany({
            where: { eventId },
            orderBy: { price: 'asc' },
        });
    }
    async createPromoCode(eventId, dto, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const existingPromo = await this.prisma.promoCode.findUnique({
            where: { code: dto.code },
        });
        if (existingPromo) {
            throw new common_1.BadRequestException('Kode promo ini sudah digunakan di sistem');
        }
        return this.prisma.promoCode.create({
            data: {
                eventId,
                code: dto.code,
                discount: dto.discount,
                maxUsage: dto.maxUsage,
            },
        });
    }
    async validatePromoCode(dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.BadRequestException('Event tidak ditemukan');
        }
        const voucher = await this.prisma.voucher.findFirst({
            where: {
                code: dto.code.toUpperCase(),
                organizerId: event.organizerId,
            },
        });
        if (voucher) {
            if (voucher.status !== 'active') {
                throw new common_1.BadRequestException('Voucher sudah tidak aktif atau kedaluwarsa');
            }
            const now = new Date();
            if (now < voucher.validFrom || now > voucher.validUntil) {
                throw new common_1.BadRequestException('Voucher berada di luar periode masa berlaku');
            }
            if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
                throw new common_1.BadRequestException('Kuota penggunaan voucher sudah habis');
            }
            if (voucher.eventId && voucher.eventId !== dto.eventId) {
                throw new common_1.BadRequestException('Voucher tidak berlaku untuk event ini');
            }
            if (voucher.applicableEventIds &&
                Array.isArray(voucher.applicableEventIds) &&
                voucher.applicableEventIds.length > 0 &&
                !voucher.applicableEventIds.includes(dto.eventId)) {
                throw new common_1.BadRequestException('Voucher tidak berlaku untuk event ini');
            }
            return {
                valid: true,
                voucherId: voucher.id,
                code: voucher.code,
                type: voucher.type,
                value: voucher.value,
                maxDiscountAmount: voucher.maxDiscountAmount,
            };
        }
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: dto.code },
        });
        if (!promo || promo.eventId !== dto.eventId) {
            throw new common_1.BadRequestException('Kode promo/voucher tidak valid untuk event ini');
        }
        if (promo.usedCount >= promo.maxUsage) {
            throw new common_1.BadRequestException('Kuota penggunaan kode promo sudah habis');
        }
        return {
            valid: true,
            promoCodeId: promo.id,
            code: promo.code,
            discount: promo.discount,
        };
    }
    async getTicket(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                orderItem: {
                    include: {
                        order: {
                            include: {
                                buyer: true,
                            },
                        },
                        ticketCategory: true,
                    },
                },
                event: {
                    include: {
                        organizer: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        return {
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            ticketCategory: ticket.orderItem.ticketCategory.name,
            buyerName: ticket.orderItem.attendeeName,
            buyerEmail: ticket.orderItem.attendeeEmail,
            eventTitle: ticket.event.title,
            eventLocation: ticket.event.location,
            eventStartDate: ticket.event.startDate,
            eventEndDate: ticket.event.endDate,
            organizerName: ticket.event.organizer.name,
            signedQrPayload: ticket.qrPayload,
        };
    }
    async getTicketsByOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pesanan tidak ditemukan');
        }
        const tickets = await this.prisma.ticket.findMany({
            where: {
                orderItem: {
                    orderId,
                },
            },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
                event: true,
            },
        });
        return tickets.map((ticket) => ({
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            ticketCategory: ticket.orderItem.ticketCategory.name,
            buyerName: ticket.orderItem.attendeeName,
            buyerEmail: ticket.orderItem.attendeeEmail,
            eventTitle: ticket.event.title,
            signedQrPayload: ticket.qrPayload,
        }));
    }
    async lookupTickets(identifier) {
        const trimmed = (identifier || '').trim();
        if (!trimmed || trimmed.length < 3) {
            throw new common_1.BadRequestException('Masukkan nomor WhatsApp, Email, atau ID Pesanan yang valid (minimal 3 karakter).');
        }
        const cleanPhone = trimmed.replace(/[^0-9]/g, '');
        const tickets = await this.prisma.ticket.findMany({
            where: {
                orderItem: {
                    order: {
                        status: 'PAID',
                    },
                    OR: [
                        { attendeeEmail: { equals: trimmed, mode: 'insensitive' } },
                        { order: { buyer: { email: { equals: trimmed, mode: 'insensitive' } } } },
                        { orderId: { equals: trimmed } },
                        ...(cleanPhone.length >= 7
                            ? [
                                { attendeePhone: { contains: cleanPhone } },
                                {
                                    attendeePhone: {
                                        contains: cleanPhone.startsWith('0')
                                            ? cleanPhone.slice(1)
                                            : cleanPhone,
                                    },
                                },
                                {
                                    attendeePhone: {
                                        contains: cleanPhone.startsWith('62')
                                            ? cleanPhone.slice(2)
                                            : cleanPhone,
                                    },
                                },
                            ]
                            : []),
                    ],
                },
            },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                        order: true,
                    },
                },
                event: {
                    include: {
                        organizer: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 30,
        });
        return tickets.map((t) => ({
            ticketId: t.id,
            ticketStatus: t.status,
            ticketCategory: t.orderItem.ticketCategory.name,
            buyerName: t.orderItem.attendeeName,
            buyerEmail: t.orderItem.attendeeEmail,
            buyerPhone: t.orderItem.attendeePhone,
            orderId: t.orderItem.orderId,
            orderDate: t.orderItem.order.createdAt,
            totalAmount: t.orderItem.order.totalAmount,
            eventTitle: t.event.title,
            eventLocation: t.event.location,
            eventStartDate: t.event.startDate,
            eventEndDate: t.event.endDate,
            organizerName: t.event.organizer.name,
            signedQrPayload: t.qrPayload,
        }));
    }
    async resendTicketNotification(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                orderItem: {
                    include: {
                        order: true,
                        ticketCategory: true,
                    },
                },
                event: true,
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        if (ticket.orderItem.order.status !== 'PAID') {
            throw new common_1.BadRequestException('Tiket belum berstatus PAID atau tidak aktif');
        }
        const qrUrl = `${this.configService.get('TAQTIX_BASE_URL') || 'https://api.taqtix.id'}/v1/tickets/${ticket.id}`;
        const attendeePhone = ticket.orderItem.attendeePhone;
        const attendeeName = ticket.orderItem.attendeeName;
        const attendeeEmail = ticket.orderItem.attendeeEmail;
        if (attendeePhone) {
            await this.notificationsQueue.add('send-ticket-whatsapp', {
                ticketId: ticket.id,
                phone: attendeePhone,
                buyerName: attendeeName,
                eventTitle: ticket.event.title,
                ticketCategory: ticket.orderItem.ticketCategory.name,
                qrUrl,
            });
        }
        if (attendeeEmail) {
            await this.notificationsQueue.add('send-ticket-email', {
                ticketId: ticket.id,
                email: attendeeEmail,
                buyerName: attendeeName,
                eventTitle: ticket.event.title,
                ticketCategory: ticket.orderItem.ticketCategory.name,
                qrUrl,
            });
        }
        return {
            message: 'Notifikasi e-ticket berhasil dikirimkan ulang ke WhatsApp dan Email Anda!',
            sentTo: {
                phone: attendeePhone,
                email: attendeeEmail,
            },
        };
    }
    async blockTicket(ticketId, reason, userId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        await this.verifyEventOwnership(ticket.eventId, userId);
        return this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                isBlocked: true,
                blockedReason: reason || 'Diblokir oleh penyelenggara acara',
                blockedBy: userId,
                blockedAt: new Date(),
            },
        });
    }
    async unblockTicket(ticketId, userId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        await this.verifyEventOwnership(ticket.eventId, userId);
        return this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                isBlocked: false,
                blockedReason: null,
                blockedBy: null,
                blockedAt: null,
            },
        });
    }
    async getBlockedVisitors(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.ticket.findMany({
            where: {
                eventId,
                isBlocked: true,
            },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
            orderBy: { blockedAt: 'desc' },
        });
    }
    async generateWristbandCodes(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const ticketsWithoutCode = await this.prisma.ticket.findMany({
            where: {
                eventId,
                wristbandCode: null,
            },
            select: { id: true },
        });
        let count = 0;
        for (const t of ticketsWithoutCode) {
            const code = `WB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            await this.prisma.ticket.update({
                where: { id: t.id },
                data: {
                    wristbandCode: code,
                    wristbandPrintedAt: new Date(),
                },
            });
            count++;
        }
        return {
            success: true,
            message: `Berhasil men-generate ${count} kode gelang.`,
            generatedCount: count,
        };
    }
    async exportWristbandCsv(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const tickets = await this.prisma.ticket.findMany({
            where: { eventId },
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const headers = ['name', 'wristbandCode', 'category', 'ticketId', 'status'];
        const rows = tickets.map((t) => [
            `"${(t.orderItem.attendeeName || '').replace(/"/g, '""')}"`,
            `"${t.wristbandCode || ''}"`,
            `"${(t.orderItem.ticketCategory.name || '').replace(/"/g, '""')}"`,
            `"${t.id}"`,
            `"${t.status}"`,
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map((r) => r.join(',')),
        ].join('\n');
        return {
            filename: `wristband-export-${eventId}.csv`,
            csv: csvContent,
        };
    }
    async getMyTickets(userId) {
        return this.prisma.ticket.findMany({
            where: {
                orderItem: {
                    order: {
                        buyerId: userId,
                    },
                },
            },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        bannerUrl: true,
                        location: true,
                        startDate: true,
                        endDate: true,
                    },
                },
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue,
        config_1.ConfigService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map