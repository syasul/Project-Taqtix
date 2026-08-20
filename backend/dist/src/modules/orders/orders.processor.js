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
exports.OrdersProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrdersProcessor = class OrdersProcessor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleExpireOrder(job) {
        const { orderId } = job.data;
        console.log(`[BullMQ] Memproses kedaluwarsa pesanan: ${orderId}`);
        try {
            await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        orderItems: true,
                    },
                });
                if (!order) {
                    console.warn(`[BullMQ] Pesanan ${orderId} tidak ditemukan.`);
                    return;
                }
                if (order.status !== client_1.OrderStatus.PENDING) {
                    console.log(`[BullMQ] Pesanan ${orderId} dilewati karena berstatus ${order.status}.`);
                    return;
                }
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: client_1.OrderStatus.CANCELLED,
                    },
                });
                for (const item of order.orderItems) {
                    await tx.ticketType.update({
                        where: { id: item.ticketTypeId },
                        data: {
                            soldCount: { decrement: item.qty },
                        },
                    });
                }
                if (order.promoCodeId) {
                    await tx.promoCode.update({
                        where: { id: order.promoCodeId },
                        data: {
                            usedCount: { decrement: 1 },
                        },
                    });
                }
                console.log(`[BullMQ] Pesanan ${orderId} berhasil dibatalkan otomatis dan kuota dikembalikan.`);
            });
        }
        catch (error) {
            console.error(`[BullMQ] Gagal membatalkan pesanan ${orderId}:`, error);
            throw error;
        }
    }
};
exports.OrdersProcessor = OrdersProcessor;
__decorate([
    (0, bull_1.Process)('expire-order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], OrdersProcessor.prototype, "handleExpireOrder", null);
exports.OrdersProcessor = OrdersProcessor = __decorate([
    (0, bull_1.Processor)('order-expiration'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersProcessor);
//# sourceMappingURL=orders.processor.js.map