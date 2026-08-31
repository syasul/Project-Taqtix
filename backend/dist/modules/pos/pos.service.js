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
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto = __importStar(require("crypto"));
let PosService = class PosService {
    prisma;
    configService;
    jwtService;
    constructor(prisma, configService, jwtService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async getOrganizerOrThrow(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
            include: { organizer: true },
        });
        if (member?.organizer)
            return member.organizer;
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
        }
        return organizer;
    }
    async verifyEventOwnership(eventId, userId) {
        const organizer = await this.getOrganizerOrThrow(userId);
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event || event.organizerId !== organizer.id) {
            throw new common_1.NotFoundException('Event tidak ditemukan atau bukan milik Anda');
        }
        return { event, organizer };
    }
    async generateQrPayload(ticketId, eventId) {
        const qrSecret = this.configService.get('QR_SIGNING_SECRET') ||
            this.configService.get('QR_SECRET') ||
            'super-secret-qr-key-change-me';
        return this.jwtService.signAsync({
            ticketId,
            eventId,
            type: 'audience',
            nonce: crypto.randomBytes(8).toString('hex'),
        }, { secret: qrSecret });
    }
    async createTransaction(eventId, dto, cashierUserId) {
        await this.verifyEventOwnership(eventId, cashierUserId);
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Daftar item belanja POS tidak boleh kosong.');
        }
        return this.prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const ticketItemsToProcess = [];
            const facilityItemsToProcess = [];
            for (const item of dto.items) {
                const itemTotal = item.unitPrice * item.qty;
                totalAmount += itemTotal;
                if (item.type === 'ticket') {
                    const cat = await tx.ticketCategory.findUnique({
                        where: { id: item.refId },
                    });
                    if (!cat || cat.eventId !== eventId) {
                        throw new common_1.BadRequestException(`Kategori tiket "${item.name}" tidak ditemukan`);
                    }
                    if (cat.quota - cat.sold < item.qty) {
                        throw new common_1.BadRequestException(`Kuota tiket "${cat.name}" tidak mencukupi (sisa ${cat.quota - cat.sold})`);
                    }
                    await tx.ticketCategory.update({
                        where: { id: cat.id },
                        data: { sold: { increment: item.qty } },
                    });
                    ticketItemsToProcess.push({
                        ticketCategoryId: cat.id,
                        name: cat.name,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                    });
                }
                else if (item.type === 'facility') {
                    const fac = await tx.eventFacility.findUnique({
                        where: { id: item.refId },
                    });
                    if (!fac || fac.eventId !== eventId) {
                        throw new common_1.BadRequestException(`Fasilitas "${item.name}" tidak ditemukan`);
                    }
                    if (fac.quota !== null && fac.quota - fac.sold < item.qty) {
                        throw new common_1.BadRequestException(`Kuota fasilitas "${fac.name}" tidak mencukupi (sisa ${fac.quota - fac.sold})`);
                    }
                    await tx.eventFacility.update({
                        where: { id: fac.id },
                        data: { sold: { increment: item.qty } },
                    });
                    facilityItemsToProcess.push({
                        facilityId: fac.id,
                        name: fac.name,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                    });
                }
            }
            const posTx = await tx.posTransaction.create({
                data: {
                    eventId,
                    items: dto.items,
                    totalAmount,
                    paymentMethod: dto.paymentMethod,
                    cashierId: cashierUserId,
                    buyerName: dto.buyerName || 'Walk-in Buyer',
                    buyerPhone: dto.buyerPhone || null,
                },
            });
            if (dto.paymentMethod === 'cash') {
                await tx.cashTransaction.create({
                    data: {
                        eventId,
                        type: ticketItemsToProcess.length > 0 ? 'ticket_sale' : 'other',
                        amount: totalAmount,
                        relatedPosTransactionId: posTx.id,
                        recordedBy: cashierUserId,
                        note: `Transaksi POS #${posTx.id.substring(0, 8)} (${dto.buyerName || 'Walk-in'})`,
                    },
                });
            }
            const generatedTickets = [];
            if (ticketItemsToProcess.length > 0) {
                let buyerUser = await tx.user.findFirst({
                    where: { email: `pos-${eventId}@taqtix.internal` },
                });
                if (!buyerUser) {
                    buyerUser = await tx.user.create({
                        data: {
                            email: `pos-${eventId}@taqtix.internal`,
                            passwordHash: '',
                            role: 'buyer',
                        },
                    });
                }
                const newOrder = await tx.order.create({
                    data: {
                        buyerId: buyerUser.id,
                        eventId,
                        totalAmount,
                        discountAmount: 0,
                        status: 'PAID',
                        expiredAt: new Date(),
                    },
                });
                for (const item of ticketItemsToProcess) {
                    const orderItem = await tx.orderItem.create({
                        data: {
                            orderId: newOrder.id,
                            ticketCategoryId: item.ticketCategoryId,
                            qty: item.qty,
                            unitPrice: item.unitPrice,
                            attendeeName: dto.buyerName || 'Walk-in Attendee',
                            attendeeEmail: `pos-${posTx.id.substring(0, 8)}@taqtix.internal`,
                            attendeePhone: dto.buyerPhone || '',
                        },
                    });
                    for (let i = 0; i < item.qty; i++) {
                        const ticketId = crypto.randomUUID();
                        const qrPayload = await this.generateQrPayload(ticketId, eventId);
                        const ticket = await tx.ticket.create({
                            data: {
                                id: ticketId,
                                orderItemId: orderItem.id,
                                eventId,
                                qrPayload,
                                status: 'VALID',
                            },
                        });
                        generatedTickets.push({
                            ticketId: ticket.id,
                            categoryName: item.name,
                            attendeeName: dto.buyerName || 'Walk-in Attendee',
                            qrPayload: ticket.qrPayload,
                        });
                    }
                }
            }
            return {
                success: true,
                posTransaction: posTx,
                tickets: generatedTickets,
            };
        });
    }
    async listTransactions(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        return this.prisma.posTransaction.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSummary(eventId, userId) {
        await this.verifyEventOwnership(eventId, userId);
        const transactions = await this.prisma.posTransaction.findMany({
            where: { eventId },
        });
        const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
        const byMethod = {
            cash: transactions
                .filter((t) => t.paymentMethod === 'cash')
                .reduce((acc, t) => acc + t.totalAmount, 0),
            qris: transactions
                .filter((t) => t.paymentMethod === 'qris')
                .reduce((acc, t) => acc + t.totalAmount, 0),
            debit: transactions
                .filter((t) => t.paymentMethod === 'debit')
                .reduce((acc, t) => acc + t.totalAmount, 0),
        };
        return {
            totalRevenue,
            totalTransactions: transactions.length,
            byPaymentMethod: byMethod,
        };
    }
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], PosService);
//# sourceMappingURL=pos.service.js.map