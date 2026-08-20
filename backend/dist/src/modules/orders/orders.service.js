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
            if (dto.promoCode) {
                const promo = await tx.promoCode.findUnique({
                    where: { code: dto.promoCode },
                });
                if (!promo || promo.eventId !== dto.eventId) {
                    throw new common_1.BadRequestException('Kode promo tidak valid untuk event ini');
                }
                if (promo.usedCount >= promo.maxUsage) {
                    throw new common_1.BadRequestException('Kuota penggunaan kode promo sudah habis');
                }
                promoCodeId = promo.id;
            }
            if (dto.affiliateCode) {
                const affiliate = await tx.affiliatePartner.findUnique({
                    where: { uniqueLink: dto.affiliateCode },
                });
                if (affiliate && affiliate.eventId === dto.eventId) {
                    affiliatePartnerId = affiliate.id;
                }
            }
            let basePriceTotal = 0;
            const verifiedItems = [];
            for (const item of dto.items) {
                const ticketTypes = await tx.$queryRaw `
          SELECT id, quota, "soldCount", name, price FROM "TicketType"
          WHERE id = ${item.ticketTypeId} AND "eventId" = ${dto.eventId}
          FOR UPDATE
        `;
                if (!ticketTypes || ticketTypes.length === 0) {
                    throw new common_1.BadRequestException(`Kategori tiket ${item.ticketTypeId} tidak ditemukan pada event ini`);
                }
                const ticketType = ticketTypes[0];
                const remaining = ticketType.quota - ticketType.soldCount;
                if (remaining < item.qty) {
                    throw new common_1.BadRequestException(`Kuota tiket kategori "${ticketType.name}" tidak mencukupi. Tersisa: ${remaining}, diminta: ${item.qty}`);
                }
                await tx.ticketType.update({
                    where: { id: ticketType.id },
                    data: {
                        soldCount: { increment: item.qty },
                    },
                });
                const itemTotal = ticketType.price * item.qty;
                basePriceTotal += itemTotal;
                verifiedItems.push({
                    ticketTypeId: ticketType.id,
                    qty: item.qty,
                    price: ticketType.price,
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
            const newOrder = await tx.order.create({
                data: {
                    buyerEmail: dto.buyerEmail,
                    buyerName: dto.buyerName,
                    buyerPhone: dto.buyerPhone,
                    eventId: dto.eventId,
                    totalAmount,
                    status: client_1.OrderStatus.PENDING,
                    promoCodeId,
                    affiliatePartnerId,
                },
            });
            for (const item of verifiedItems) {
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        ticketTypeId: item.ticketTypeId,
                        qty: item.qty,
                        price: item.price,
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
                        ticketType: true,
                    },
                },
                event: true,
                payment: true,
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