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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let PaymentsService = class PaymentsService {
    prisma;
    configService;
    jwtService;
    notificationsQueue;
    constructor(prisma, configService, jwtService, notificationsQueue) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
        this.notificationsQueue = notificationsQueue;
    }
    async pay(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pesanan tidak ditemukan');
        }
        if (order.status !== client_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Pesanan ini sudah diproses atau dibatalkan');
        }
        let payment = order.payment;
        if (!payment) {
            payment = await this.prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: order.totalAmount,
                    status: client_1.PaymentStatus.PENDING,
                },
            });
        }
        const serverKey = this.configService.get('TAQTIX_MIDTRANS_SERVER_KEY');
        const isProd = this.configService.get('TAQTIX_MIDTRANS_IS_PRODUCTION') === 'true';
        if (!serverKey) {
            throw new Error('Midtrans Server Key belum dikonfigurasi di environment');
        }
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
        const url = isProd
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify({
                    transaction_details: {
                        order_id: order.id,
                        gross_amount: order.totalAmount,
                    },
                    customer_details: {
                        first_name: order.buyerName,
                        email: order.buyerEmail,
                        phone: order.buyerPhone || undefined,
                    },
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Midtrans API Error:', data);
                throw new common_1.BadRequestException('Gagal menghubungi layanan pembayaran');
            }
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    snapToken: data.token,
                },
            });
            return {
                token: data.token,
                redirectUrl: data.redirect_url,
            };
        }
        catch (error) {
            console.error('Gagal melakukan request Snap Midtrans:', error);
            throw new common_1.BadRequestException('Gagal memproses pembayaran');
        }
    }
    async handleWebhook(body) {
        const { order_id, transaction_status, fraud_status, gross_amount, signature_key, status_code, transaction_id, } = body;
        const serverKey = this.configService.get('TAQTIX_MIDTRANS_SERVER_KEY') || '';
        const rawString = order_id + status_code + gross_amount + serverKey;
        const computedSignature = crypto.createHash('sha512').update(rawString).digest('hex');
        if (computedSignature !== signature_key) {
            throw new common_1.BadRequestException('Signature key tidak cocok');
        }
        console.log(`[Midtrans Webhook] Verifikasi sukses untuk Order ID: ${order_id}, Status: ${transaction_status}`);
        const isSuccess = transaction_status === 'settlement' ||
            (transaction_status === 'capture' && fraud_status === 'accept');
        const isCancel = transaction_status === 'deny' ||
            transaction_status === 'cancel' ||
            transaction_status === 'expire';
        if (isSuccess) {
            await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: order_id },
                    include: {
                        orderItems: {
                            include: {
                                ticketType: true,
                            },
                        },
                        payment: true,
                        event: true,
                    },
                });
                if (!order) {
                    throw new common_1.NotFoundException('Pesanan tidak ditemukan');
                }
                if (order.status === client_1.OrderStatus.PAID) {
                    return;
                }
                if (order.payment) {
                    await tx.payment.update({
                        where: { id: order.payment.id },
                        data: {
                            status: client_1.PaymentStatus.SUCCESS,
                            paidAt: new Date(),
                            gatewayRef: transaction_id,
                        },
                    });
                }
                await tx.order.update({
                    where: { id: order_id },
                    data: {
                        status: client_1.OrderStatus.PAID,
                    },
                });
                const generatedTickets = [];
                for (const item of order.orderItems) {
                    for (let i = 0; i < item.qty; i++) {
                        const ticket = await tx.ticket.create({
                            data: {
                                orderId: order.id,
                                ticketTypeId: item.ticketTypeId,
                                status: client_1.TicketStatus.ISSUED,
                                code: 'TEMP',
                            },
                        });
                        const signedCode = await this.jwtService.signAsync({
                            ticketId: ticket.id,
                            orderId: order.id,
                        }, {
                            secret: this.configService.get('TAQTIX_JWT_ACCESS_SECRET'),
                        });
                        const updatedTicket = await tx.ticket.update({
                            where: { id: ticket.id },
                            data: { code: signedCode },
                            include: {
                                ticketType: true,
                            },
                        });
                        generatedTickets.push(updatedTicket);
                    }
                }
                if (order.affiliatePartnerId) {
                    const affiliate = await tx.affiliatePartner.findUnique({
                        where: { id: order.affiliatePartnerId },
                    });
                    if (affiliate) {
                        const totalQty = order.orderItems.reduce((acc, item) => acc + item.qty, 0);
                        const calculatedCommission = order.totalAmount * (affiliate.commissionPct / 100);
                        await tx.affiliatePartner.update({
                            where: { id: affiliate.id },
                            data: {
                                totalSales: { increment: totalQty },
                                commission: { increment: calculatedCommission },
                            },
                        });
                    }
                }
                for (const ticket of generatedTickets) {
                    const qrUrl = `${this.configService.get('TAQTIX_BASE_URL') || 'http://localhost:3001'}/api/v1/tickets/${ticket.id}`;
                    if (order.buyerPhone) {
                        await this.notificationsQueue.add('send-ticket-whatsapp', {
                            ticketId: ticket.id,
                            phone: order.buyerPhone,
                            buyerName: order.buyerName,
                            eventTitle: order.event.title,
                            ticketCategory: ticket.ticketType.name,
                            qrUrl,
                        });
                    }
                    await this.notificationsQueue.add('send-ticket-email', {
                        ticketId: ticket.id,
                        email: order.buyerEmail,
                        buyerName: order.buyerName,
                        eventTitle: order.event.title,
                        ticketCategory: ticket.ticketType.name,
                        qrUrl,
                    });
                }
            });
        }
        else if (isCancel) {
            await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: order_id },
                    include: {
                        orderItems: true,
                        payment: true,
                    },
                });
                if (!order || order.status === client_1.OrderStatus.CANCELLED) {
                    return;
                }
                if (order.payment) {
                    await tx.payment.update({
                        where: { id: order.payment.id },
                        data: {
                            status: client_1.PaymentStatus.FAIL,
                        },
                    });
                }
                await tx.order.update({
                    where: { id: order_id },
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
            });
        }
        return { received: true };
    }
    async getTicket(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                order: true,
                ticketType: true,
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: ticket.ticketType.eventId },
            include: {
                organizer: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return {
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            ticketCategory: ticket.ticketType.name,
            buyerName: ticket.order.buyerName,
            buyerEmail: ticket.order.buyerEmail,
            eventTitle: event?.title,
            eventLocation: event?.location,
            eventStartDate: event?.startDate,
            eventEndDate: event?.endDate,
            organizerName: event?.organizer.name,
            signedQrPayload: ticket.code,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        bullmq_1.Queue])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map