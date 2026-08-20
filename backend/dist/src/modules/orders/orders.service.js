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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
let OrdersService = class OrdersService {
    prisma;
    orderExpirationQueue;
    constructor(prisma, orderExpirationQueue) {
        this.prisma = prisma;
        this.orderExpirationQueue = orderExpirationQueue;
    }
    async create(dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        const order = await this.prisma.$transaction(async (tx) => {
            let discountAmt = 0;
            let promoCodeId = undefined;
            let affiliatePartnerId = undefined;
            let buyer = await tx.user.findUnique({
                where: { email: dto.buyerEmail },
            });
            if (!buyer) {
                buyer = await tx.user.create({
                    data: {
                        email: dto.buyerEmail,
                        passwordHash: '',
                        role: 'buyer',
                    },
                });
            }
            if (dto.promoCode) {
                const promo = await tx.promoCode.findUnique({
                    where: { code: dto.promoCode },
                });
                if (!promo || promo.eventId !== dto.eventId) {
                    throw new common_1.HttpException({
                        code: 'INVALID_PROMO_CODE',
                        message: 'Kode promo tidak valid untuk event ini',
                    }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                }
                if (promo.usedCount >= promo.maxUsage) {
                    throw new common_1.HttpException({
                        code: 'INVALID_PROMO_CODE',
                        message: 'Kuota penggunaan kode promo sudah habis',
                    }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                }
                promoCodeId = promo.id;
            }
            if (dto.affiliateCode) {
                const affiliate = await tx.partner.findUnique({
                    where: { uniqueCode: dto.affiliateCode },
                });
                if (affiliate && affiliate.eventId === dto.eventId) {
                    affiliatePartnerId = affiliate.id;
                }
            }
            let basePriceTotal = 0;
            const verifiedItems = [];
            for (const item of dto.items) {
                const ticketCategories = await tx.$queryRaw `
          SELECT id, quota, sold, name, price FROM "TicketCategory"
          WHERE id = ${item.ticketCategoryId} AND "eventId" = ${dto.eventId}
          FOR UPDATE
        `;
                if (!ticketCategories || ticketCategories.length === 0) {
                    throw new common_1.BadRequestException(`Kategori tiket ${item.ticketCategoryId} tidak ditemukan pada event ini`);
                }
                const ticketCategory = ticketCategories[0];
                const remaining = ticketCategory.quota - ticketCategory.sold;
                if (remaining < item.qty) {
                    throw new common_1.HttpException({
                        code: 'TICKET_SOLD_OUT',
                        message: `Kuota tiket kategori "${ticketCategory.name}" tidak mencukupi. Tersisa: ${remaining}, diminta: ${item.qty}`,
                    }, common_1.HttpStatus.CONFLICT);
                }
                await tx.ticketCategory.update({
                    where: { id: ticketCategory.id },
                    data: {
                        sold: { increment: item.qty },
                    },
                });
                const itemTotal = ticketCategory.price * item.qty;
                basePriceTotal += itemTotal;
                verifiedItems.push({
                    ticketCategoryId: ticketCategory.id,
                    qty: item.qty,
                    price: ticketCategory.price,
                });
            }
            if (dto.promoCode && promoCodeId) {
                const promo = await tx.promoCode.findUnique({
                    where: { id: promoCodeId },
                });
                if (promo) {
                    if (promo.discount <= 100) {
                        discountAmt = basePriceTotal * (promo.discount / 100);
                    }
                    else {
                        discountAmt = promo.discount;
                    }
                    discountAmt = Math.min(discountAmt, basePriceTotal);
                    await tx.promoCode.update({
                        where: { id: promo.id },
                        data: {
                            usedCount: { increment: 1 },
                        },
                    });
                }
            }
            const totalAmount = basePriceTotal - discountAmt;
            const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
            const newOrder = await tx.order.create({
                data: {
                    buyerId: buyer.id,
                    eventId: dto.eventId,
                    totalAmount,
                    discountAmount: discountAmt,
                    status: client_1.OrderStatus.PENDING,
                    promoCodeId,
                    partnerId: affiliatePartnerId,
                    expiredAt,
                },
            });
            for (const item of verifiedItems) {
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        ticketCategoryId: item.ticketCategoryId,
                        qty: item.qty,
                        unitPrice: item.price,
                        attendeeName: dto.buyerName,
                        attendeeEmail: dto.buyerEmail,
                        attendeePhone: dto.buyerPhone || '',
                    },
                });
            }
            return newOrder;
        });
        await this.orderExpirationQueue.add('expire-order', { orderId: order.id }, { delay: 15 * 60 * 1000 });
        return order;
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        ticketCategory: true,
                    },
                },
                event: true,
                payment: true,
                buyer: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pesanan tidak ditemukan');
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('order-expiration')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue])
], OrdersService);
//# sourceMappingURL=orders.service.js.map