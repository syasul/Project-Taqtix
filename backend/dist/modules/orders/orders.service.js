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
            include: {
                customFormFields: true,
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.customFormFields && event.customFormFields.length > 0) {
            const requiredFields = event.customFormFields.filter((f) => f.required);
            for (const reqField of requiredFields) {
                const inOrder = dto.customFieldAnswers && dto.customFieldAnswers[reqField.id];
                const inItems = dto.items.some((it) => it.customFieldAnswers && it.customFieldAnswers[reqField.id]);
                if (!inOrder && !inItems) {
                    throw new common_1.BadRequestException(`Formulir "${reqField.label}" wajib diisi.`);
                }
            }
        }
        const order = await this.prisma.$transaction(async (tx) => {
            let discountAmt = 0;
            let promoCodeId = undefined;
            let voucherId = undefined;
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
                const voucher = await tx.voucher.findFirst({
                    where: {
                        code: dto.promoCode.toUpperCase(),
                        organizerId: event.organizerId,
                    },
                });
                if (voucher) {
                    if (voucher.status !== 'active') {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Voucher sudah tidak aktif atau kedaluwarsa',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    const now = new Date();
                    if (now < voucher.validFrom || now > voucher.validUntil) {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Voucher berada di luar periode masa berlaku',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Kuota penggunaan voucher sudah habis',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    if (voucher.eventId && voucher.eventId !== dto.eventId) {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Voucher tidak berlaku untuk event ini',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    voucherId = voucher.id;
                }
                else {
                    const promo = await tx.promoCode.findUnique({
                        where: { code: dto.promoCode },
                    });
                    if (!promo || promo.eventId !== dto.eventId) {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Kode voucher/promo tidak valid untuk event ini',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    if (promo.usedCount >= promo.maxUsage) {
                        throw new common_1.HttpException({
                            code: 'INVALID_PROMO_CODE',
                            message: 'Kuota penggunaan promo sudah habis',
                        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                    promoCodeId = promo.id;
                }
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
                let itemFacilityCost = 0;
                const verifiedItemFacilities = [];
                if (item.facilities && item.facilities.length > 0) {
                    for (const fac of item.facilities) {
                        const facility = await tx.eventFacility.findUnique({
                            where: { id: fac.facilityId },
                        });
                        if (facility && facility.eventId === dto.eventId) {
                            if (facility.quota !== null && facility.quota - facility.sold < fac.qty) {
                                throw new common_1.BadRequestException(`Fasilitas "${facility.name}" sudah habis.`);
                            }
                            await tx.eventFacility.update({
                                where: { id: facility.id },
                                data: { sold: { increment: fac.qty } },
                            });
                            const cost = facility.price * fac.qty;
                            itemFacilityCost += cost;
                            verifiedItemFacilities.push({
                                facilityId: facility.id,
                                name: facility.name,
                                qty: fac.qty,
                                price: facility.price,
                            });
                        }
                    }
                }
                basePriceTotal += itemFacilityCost;
                verifiedItems.push({
                    ticketCategoryId: ticketCategory.id,
                    qty: item.qty,
                    price: ticketCategory.price,
                    customFieldAnswers: item.customFieldAnswers || dto.customFieldAnswers || null,
                    facilities: verifiedItemFacilities.length > 0 ? verifiedItemFacilities : null,
                });
            }
            if (voucherId) {
                const voucher = await tx.voucher.findUnique({ where: { id: voucherId } });
                if (voucher) {
                    if (voucher.type === 'percentage') {
                        discountAmt = (basePriceTotal * voucher.value) / 100;
                        if (voucher.maxDiscountAmount && discountAmt > voucher.maxDiscountAmount) {
                            discountAmt = voucher.maxDiscountAmount;
                        }
                    }
                    else {
                        discountAmt = voucher.value;
                    }
                    discountAmt = Math.min(discountAmt, basePriceTotal);
                    await tx.voucher.update({
                        where: { id: voucher.id },
                        data: { usageCount: { increment: 1 } },
                    });
                }
            }
            else if (promoCodeId) {
                const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
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
                        data: { usedCount: { increment: 1 } },
                    });
                }
            }
            const totalAmount = Math.max(0, basePriceTotal - discountAmt);
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
                    utmSource: dto.utmSource || null,
                    utmMedium: dto.utmMedium || null,
                    utmCampaign: dto.utmCampaign || null,
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
                        city: dto.city || null,
                        customFieldAnswers: item.customFieldAnswers,
                        facilities: item.facilities,
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