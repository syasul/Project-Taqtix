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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const doku_service_1 = require("../payments/doku/doku.service");
const config_1 = require("@nestjs/config");
let OrdersService = OrdersService_1 = class OrdersService {
    prisma;
    orderExpirationQueue;
    checkoutQueue;
    dokuService;
    configService;
    logger = new common_1.Logger(OrdersService_1.name);
    idempotencyStore = new Map();
    constructor(prisma, orderExpirationQueue, checkoutQueue, dokuService, configService) {
        this.prisma = prisma;
        this.orderExpirationQueue = orderExpirationQueue;
        this.checkoutQueue = checkoutQueue;
        this.dokuService = dokuService;
        this.configService = configService;
    }
    async create(dto, authenticatedUserId, idempotencyKey) {
        if (idempotencyKey) {
            const cached = this.idempotencyStore.get(idempotencyKey);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.order;
            }
        }
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
            include: {
                customFormFields: true,
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.requireLogin && !authenticatedUserId) {
            throw new common_1.UnauthorizedException('Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu sebelum memesan tiket.');
        }
        if (event.customFormFields && event.customFormFields.length > 0) {
            for (const field of event.customFormFields) {
                const orderAns = dto.customFieldAnswers?.[field.id];
                const itemAnswers = dto.items
                    .map((it) => it.customFieldAnswers?.[field.id])
                    .filter((a) => a !== undefined && a !== null && a !== '');
                if (field.required) {
                    const hasOrderAns = orderAns !== undefined && orderAns !== null && orderAns !== '';
                    const hasItemAns = itemAnswers.length > 0;
                    if (!hasOrderAns && !hasItemAns) {
                        throw new common_1.BadRequestException({
                            code: 'VALIDATION_ERROR',
                            message: `Formulir "${field.label}" wajib diisi.`,
                            field: field.label,
                        });
                    }
                }
                if (field.fieldType === 'dropdown' &&
                    Array.isArray(field.options) &&
                    field.options.length > 0) {
                    const validOptions = field.options.map((o) => String(o));
                    const allAnswers = [orderAns, ...itemAnswers].filter((a) => typeof a === 'string' && a.trim() !== '');
                    for (const ans of allAnswers) {
                        if (!validOptions.includes(ans)) {
                            throw new common_1.BadRequestException({
                                code: 'VALIDATION_ERROR',
                                message: `Jawaban "${ans}" untuk field "${field.label}" tidak valid. Pilihan yang tersedia: ${validOptions.join(', ')}`,
                                field: field.label,
                            });
                        }
                    }
                }
            }
        }
        const order = await this.prisma.$transaction(async (tx) => {
            let discountAmt = 0;
            let promoCodeId = undefined;
            let voucherId = undefined;
            let affiliatePartnerId = undefined;
            let buyer = null;
            if (authenticatedUserId) {
                buyer = await tx.user.findUnique({
                    where: { id: authenticatedUserId },
                });
            }
            if (!buyer) {
                buyer = await tx.user.findUnique({
                    where: { email: dto.buyerEmail },
                });
            }
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
                        const facilitiesLocked = await tx.$queryRaw `
              SELECT id, quota, sold, name, price, "applicableTicketCategoryIds" FROM "EventFacility"
              WHERE id = ${fac.facilityId} AND "eventId" = ${dto.eventId}
              FOR UPDATE
            `;
                        if (!facilitiesLocked || facilitiesLocked.length === 0) {
                            throw new common_1.BadRequestException(`Fasilitas dengan ID "${fac.facilityId}" tidak ditemukan pada event ini.`);
                        }
                        const facility = facilitiesLocked[0];
                        let applicableCategories = facility.applicableTicketCategoryIds;
                        if (typeof applicableCategories === 'string') {
                            try {
                                applicableCategories = JSON.parse(applicableCategories);
                            }
                            catch {
                                applicableCategories = [];
                            }
                        }
                        if (Array.isArray(applicableCategories) &&
                            applicableCategories.length > 0 &&
                            !applicableCategories.includes(item.ticketCategoryId)) {
                            throw new common_1.BadRequestException({
                                code: 'FACILITY_NOT_APPLICABLE',
                                message: `Fasilitas "${facility.name}" tidak berlaku untuk kategori tiket "${ticketCategory.name}".`,
                            });
                        }
                        if (facility.quota !== null &&
                            facility.quota - facility.sold < fac.qty) {
                            throw new common_1.HttpException({
                                code: 'FACILITY_SOLD_OUT',
                                message: `Kuota fasilitas "${facility.name}" tidak mencukupi (sisa ${facility.quota - facility.sold}, diminta: ${fac.qty}).`,
                            }, common_1.HttpStatus.CONFLICT);
                        }
                        await tx.eventFacility.update({
                            where: { id: facility.id },
                            data: { sold: { increment: fac.qty } },
                        });
                        const cost = Number(facility.price) * fac.qty;
                        itemFacilityCost += cost;
                        verifiedItemFacilities.push({
                            facilityId: facility.id,
                            name: facility.name,
                            qty: fac.qty,
                            price: Number(facility.price),
                        });
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
                const voucher = await tx.voucher.findUnique({
                    where: { id: voucherId },
                });
                if (voucher) {
                    if (voucher.type === 'percentage') {
                        discountAmt = (basePriceTotal * voucher.value) / 100;
                        if (voucher.maxDiscountAmount &&
                            discountAmt > voucher.maxDiscountAmount) {
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
                        data: { usedCount: { increment: 1 } },
                    });
                }
            }
            const totalAmount = Math.max(0, basePriceTotal - discountAmt);
            const expiredAt = new Date(Date.now() + 10 * 60 * 1000);
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
        const fullOrder = await this.prisma.order.findUnique({
            where: { id: order.id },
            include: {
                buyer: true,
                orderItems: {
                    include: {
                        ticketCategory: true,
                    },
                },
                payment: true,
            },
        });
        let payment = fullOrder?.payment;
        if (!payment) {
            payment = await this.prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: order.totalAmount,
                    status: client_1.PaymentStatus.PENDING,
                    provider: 'doku',
                },
            });
        }
        const dokuConfig = this.dokuService.getConfig();
        let paymentUrl = undefined;
        let expirationDelay = 10 * 60 * 1000;
        if (dokuConfig.clientId && dokuConfig.secretKey) {
            try {
                const result = await this.dokuService.createPayment(fullOrder, payment);
                paymentUrl = result.paymentUrl;
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        externalId: result.tokenId || result.invoiceNumber,
                        snapToken: result.paymentUrl,
                        provider: 'doku',
                    },
                });
                if (result.expiredDate) {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { expiredAt: result.expiredDate },
                    });
                    order.expiredAt = result.expiredDate;
                    expirationDelay = Math.max(1000, result.expiredDate.getTime() - Date.now());
                }
            }
            catch (dokuError) {
                this.logger.error(`Gagal memanggil DokuService.createPayment untuk order ${order.id}:`, dokuError);
                await this.rollbackOrder(order.id, dto);
                throw new common_1.BadRequestException(dokuError?.message ||
                    'Gagal memproses pembuatan pembayaran dengan DOKU Checkout');
            }
        }
        else {
            const frontendUrl = this.configService.get('TAQTIX_FRONTEND_URL') ||
                this.configService.get('TAQTIX_WEB_URL') ||
                'http://localhost:3000';
            paymentUrl = `${frontendUrl}/checkout?orderId=${order.id}&simulation=true`;
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    externalId: 'DEV_MOCK_' + order.id,
                    snapToken: paymentUrl,
                    provider: 'doku_sandbox_mock',
                },
            });
        }
        order.paymentUrl = paymentUrl;
        if (idempotencyKey) {
            this.idempotencyStore.set(idempotencyKey, {
                order,
                expiresAt: Date.now() + 10 * 60 * 1000,
            });
            if (this.idempotencyStore.size > 1000) {
                const now = Date.now();
                for (const [k, v] of this.idempotencyStore.entries()) {
                    if (v.expiresAt <= now)
                        this.idempotencyStore.delete(k);
                }
            }
        }
        await this.orderExpirationQueue.add('expire-order', { orderId: order.id }, { delay: expirationDelay });
        return order;
    }
    async rollbackOrder(orderId, dto) {
        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: client_1.OrderStatus.CANCELLED },
                });
                const payment = await tx.payment.findUnique({
                    where: { orderId },
                });
                if (payment) {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: client_1.PaymentStatus.FAILED },
                    });
                }
                for (const item of dto.items) {
                    await tx.ticketCategory.update({
                        where: { id: item.ticketCategoryId },
                        data: { sold: { decrement: item.qty } },
                    });
                    if (item.facilities && item.facilities.length > 0) {
                        for (const fac of item.facilities) {
                            await tx.eventFacility.update({
                                where: { id: fac.facilityId },
                                data: { sold: { decrement: fac.qty } },
                            });
                        }
                    }
                }
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                });
                if (order?.promoCodeId) {
                    await tx.promoCode.update({
                        where: { id: order.promoCodeId },
                        data: { usedCount: { decrement: 1 } },
                    });
                }
                if (dto.promoCode) {
                    const voucher = await tx.voucher.findFirst({
                        where: { code: dto.promoCode.toUpperCase() },
                    });
                    if (voucher) {
                        await tx.voucher.update({
                            where: { id: voucher.id },
                            data: { usageCount: { decrement: 1 } },
                        });
                    }
                }
            });
            this.logger.warn(`[OrdersService] Rollback order ${orderId} berhasil dieksekusi.`);
        }
        catch (rollbackErr) {
            this.logger.error(`[OrdersService] Gagal melakukan rollback order ${orderId}:`, rollbackErr);
        }
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
    async findMyOrders(userId) {
        return this.prisma.order.findMany({
            where: {
                buyerId: userId,
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
                payment: true,
                orderItems: {
                    include: {
                        ticketCategory: true,
                        tickets: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async enqueueOrder(dto, authenticatedUserId, idempotencyKey) {
        if (idempotencyKey) {
            const cached = this.idempotencyStore.get(idempotencyKey);
            if (cached && cached.expiresAt > Date.now()) {
                return {
                    status: 'COMPLETED',
                    queueId: 'idempotent-cached',
                    position: 0,
                    data: {
                        orderId: cached.order.id,
                        paymentUrl: cached.order.paymentUrl || null,
                        totalAmount: cached.order.totalAmount,
                    },
                };
            }
        }
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
            select: { id: true, title: true, requireLogin: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        if (event.requireLogin && !authenticatedUserId) {
            throw new common_1.UnauthorizedException('Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu.');
        }
        const queueId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await this.checkoutQueue.add('process-checkout', {
            queueId,
            dto,
            authenticatedUserId,
            idempotencyKey,
        }, {
            jobId: queueId,
            attempts: 1,
            removeOnComplete: 1000,
            removeOnFail: 1000,
        });
        const waitingCount = await this.checkoutQueue.getWaitingCount();
        return {
            status: 'QUEUED',
            queueId,
            position: Math.max(1, waitingCount),
            estimatedWaitSeconds: Math.max(2, Math.ceil(waitingCount / 25)),
            message: 'Pesanan Anda berhasil masuk ke antrean ruang tunggu resmi TAQtix.',
        };
    }
    async getQueueStatus(queueId) {
        const job = await this.checkoutQueue.getJob(queueId);
        if (!job) {
            throw new common_1.NotFoundException('Antrean tidak ditemukan atau sudah selesai.');
        }
        const state = await job.getState();
        if (state === 'completed') {
            return {
                status: 'COMPLETED',
                queueId,
                position: 0,
                data: job.returnvalue,
            };
        }
        if (state === 'failed') {
            return {
                status: 'FAILED',
                queueId,
                position: 0,
                error: job.failedReason || 'Gagal memproses pesanan di antrean.',
            };
        }
        if (state === 'active') {
            return {
                status: 'PROCESSING',
                queueId,
                position: 1,
                estimatedWaitSeconds: 1,
                message: 'Pesanan Anda sedang diproses oleh worker...',
            };
        }
        const waitingJobs = await this.checkoutQueue.getWaiting(0, 50);
        const index = waitingJobs.findIndex((j) => j.id === queueId);
        const position = index >= 0
            ? index + 1
            : Math.max(1, await this.checkoutQueue.getWaitingCount());
        return {
            status: 'QUEUED',
            queueId,
            position,
            estimatedWaitSeconds: Math.max(2, Math.ceil(position / 25)),
            message: 'Anda sedang mengantre di ruang tunggu.',
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('order-expiration')),
    __param(2, (0, bull_1.InjectQueue)('order-checkout-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue,
        bullmq_1.Queue,
        doku_service_1.DokuService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map