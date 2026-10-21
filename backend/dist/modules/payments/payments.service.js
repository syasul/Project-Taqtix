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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const doku_service_1 = require("./doku/doku.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    configService;
    jwtService;
    notificationsQueue;
    dokuService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, configService, jwtService, notificationsQueue, dokuService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
        this.notificationsQueue = notificationsQueue;
        this.dokuService = dokuService;
    }
    async pay(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                payment: true,
                buyer: true,
                orderItems: {
                    include: {
                        ticketCategory: true,
                    },
                },
            },
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
                    provider: 'doku',
                },
            });
        }
        const { clientId: dokuClientId, secretKey: dokuSecretKey } = this.getDokuConfig();
        if (dokuClientId && dokuSecretKey) {
            return this.createDokuPayment(order, payment, dokuClientId, dokuSecretKey);
        }
        const midtransServerKey = this.configService.get('TAQTIX_MIDTRANS_SERVER_KEY');
        if (midtransServerKey) {
            return this.createMidtransPayment(order, payment, midtransServerKey);
        }
        const frontendUrl = this.configService.get('TAQTIX_FRONTEND_URL') ||
            this.configService.get('TAQTIX_WEB_URL') ||
            'http://localhost:3000';
        const mockRedirectUrl = `${frontendUrl}/orders/${order.id}?simulation=true`;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                externalId: 'DEV_MOCK_' + order.id,
                provider: 'doku_sandbox_mock',
            },
        });
        return {
            token: 'mock_token_' + order.id,
            redirectUrl: mockRedirectUrl,
            provider: 'doku_sandbox_mock',
            message: 'Mode sandbox simulasi aktif (DOKU_CLIENT_ID & DOKU_SECRET_KEY belum diisi di environment)',
        };
    }
    getDokuConfig() {
        const clientId = this.configService.get('DOKU_CLIENT_ID') ||
            this.configService.get('PAYMENT_PROVIDER_KEY') ||
            '';
        const secretKey = this.configService.get('DOKU_SECRET_KEY') ||
            this.configService.get('PAYMENT_PROVIDER_SECRET') ||
            '';
        const isBrnProdKey = clientId.startsWith('BRN-');
        const dokuEnv = (this.configService.get('DOKU_ENV') ||
            (this.configService.get('NODE_ENV') === 'production' || isBrnProdKey
                ? 'production'
                : 'sandbox')).toLowerCase();
        const isProduction = dokuEnv === 'production' || isBrnProdKey;
        const baseUrl = isProduction
            ? this.configService.get('DOKU_BASE_URL_PRODUCTION') ||
                'https://api.doku.com'
            : this.configService.get('DOKU_BASE_URL_SANDBOX') ||
                'https://api-sandbox.doku.com';
        return { clientId, secretKey, dokuEnv, isProduction, baseUrl };
    }
    generateDokuSignature(secretKey, clientId, requestId, timestamp, requestTarget, bodyString) {
        let stringToSign = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}`;
        if (bodyString !== undefined && bodyString !== null && bodyString !== '') {
            const digest = crypto
                .createHash('sha256')
                .update(bodyString)
                .digest('base64');
            stringToSign += `\nDigest:${digest}`;
        }
        const hmac = crypto
            .createHmac('sha256', secretKey)
            .update(stringToSign)
            .digest('base64');
        return `HMACSHA256=${hmac}`;
    }
    safeCompareSignatures(sigA, sigB) {
        if (!sigA || !sigB)
            return false;
        const bufA = Buffer.from(sigA);
        const bufB = Buffer.from(sigB);
        if (bufA.length !== bufB.length)
            return false;
        return crypto.timingSafeEqual(bufA, bufB);
    }
    parseDokuExpiredDate(rawDateStr) {
        if (!rawDateStr ||
            typeof rawDateStr !== 'string' ||
            rawDateStr.length !== 14) {
            return null;
        }
        const year = rawDateStr.substring(0, 4);
        const month = rawDateStr.substring(4, 6);
        const day = rawDateStr.substring(6, 8);
        const hour = rawDateStr.substring(8, 10);
        const minute = rawDateStr.substring(10, 12);
        const second = rawDateStr.substring(12, 14);
        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? null : date;
    }
    async createDokuPayment(order, payment, _clientId, _secretKey) {
        try {
            const result = await this.dokuService.createPayment(order, payment);
            if (result.expiredDate) {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { expiredAt: result.expiredDate },
                });
            }
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    snapToken: result.paymentUrl,
                    externalId: result.tokenId || result.invoiceNumber,
                    provider: 'doku',
                },
            });
            return {
                token: result.paymentUrl,
                redirectUrl: result.paymentUrl,
                provider: 'doku',
                invoiceNumber: result.invoiceNumber,
            };
        }
        catch (err) {
            this.logger.error('Gagal request DOKU Checkout:', err);
            throw new common_1.BadRequestException(err.message || 'Gagal memproses pembayaran DOKU');
        }
    }
    async createMidtransPayment(order, payment, serverKey) {
        const isProd = this.configService.get('TAQTIX_MIDTRANS_IS_PRODUCTION') ===
            'true';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
        const url = isProd
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
        const firstItem = order.orderItems[0];
        const buyerName = firstItem ? firstItem.attendeeName : 'Guest';
        const buyerEmail = order.buyer.email;
        const buyerPhone = firstItem ? firstItem.attendeePhone : '';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: authHeader,
                },
                body: JSON.stringify({
                    transaction_details: {
                        order_id: order.id,
                        gross_amount: order.totalAmount,
                    },
                    customer_details: {
                        first_name: buyerName,
                        email: buyerEmail,
                        phone: buyerPhone || undefined,
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
                    provider: 'midtrans',
                },
            });
            return {
                token: data.token,
                redirectUrl: data.redirect_url,
                provider: 'midtrans',
            };
        }
        catch (error) {
            console.error('Gagal melakukan request Snap Midtrans:', error);
            throw new common_1.BadRequestException('Gagal memproses pembayaran Midtrans');
        }
    }
    async handleWebhook(body, provider = 'doku', headers = {}, rawBody, requestPath) {
        const normalized = (provider || 'doku').toLowerCase();
        console.log(`[Payment Webhook] Menerima webhook provider: ${normalized}`);
        if (normalized === 'doku' ||
            body?.order?.invoice_number ||
            body?.transaction?.status) {
            return this.handleDokuWebhook(body, headers, rawBody, requestPath);
        }
        if (normalized === 'midtrans' || (body?.order_id && body?.signature_key)) {
            return this.handleMidtransWebhook(body);
        }
        if (normalized === 'test' || normalized === 'sandbox') {
            const orderId = body?.orderId || body?.order_id;
            if (!orderId) {
                throw new common_1.BadRequestException('orderId diperlukan');
            }
            await this.processPaymentSuccess(orderId, 'TEST_' + crypto.randomUUID());
            return { received: true, status: 'success' };
        }
        throw new common_1.BadRequestException(`Provider webhook ${provider} tidak didukung`);
    }
    async handleDokuWebhook(body, headers, rawBody, requestPath) {
        const payload = body;
        const rawInvoice = payload?.order?.invoice_number || payload?.order?.invoiceNumber;
        const transactionStatus = String(payload?.transaction?.status || payload?.transaction_status || '').toUpperCase();
        const transactionId = String(payload?.transaction?.id ||
            payload?.transaction?.original_request_id ||
            payload?.service?.id ||
            crypto.randomUUID());
        const transactionDateStr = payload?.transaction?.date;
        if (!rawInvoice) {
            throw new common_1.BadRequestException('Invoice number tidak ditemukan pada payload DOKU');
        }
        const { clientId: configuredClientId, secretKey: dokuSecretKey, isProduction, } = this.getDokuConfig();
        const isValidSignature = this.dokuService.verifyWebhookSignature(headers, rawBody, requestPath);
        if (!isValidSignature) {
            this.logger.warn(`[DOKU Webhook] Security Alert: Invalid signature received from IP or headers! Target: ${requestPath}`);
            throw new common_1.UnauthorizedException('Signature verifikasi webhook DOKU tidak valid');
        }
        const cleanOrderId = rawInvoice.startsWith('TAQTIX-ORD-')
            ? rawInvoice.replace('TAQTIX-ORD-', '')
            : rawInvoice;
        const order = await this.prisma.order.findFirst({
            where: {
                OR: [
                    { id: cleanOrderId },
                    { id: rawInvoice },
                    { payment: { externalId: rawInvoice } },
                ],
            },
            include: {
                payment: true,
            },
        });
        if (!order) {
            console.warn(`[DOKU Webhook] Order tidak ditemukan untuk invoice: ${rawInvoice}`);
            throw new common_1.NotFoundException(`Order dengan invoice ${rawInvoice} tidak ditemukan`);
        }
        const incomingAmount = Number(body?.order?.amount);
        if (!isNaN(incomingAmount) &&
            Math.round(incomingAmount) !== Math.round(order.totalAmount)) {
            console.error(`[DOKU Webhook] Nominal tidak cocok! Incoming: ${incomingAmount}, Expected: ${order.totalAmount}`);
            throw new common_1.BadRequestException('Nominal pembayaran tidak sesuai dengan total tagihan order');
        }
        if (order.status === client_1.OrderStatus.PAID) {
            console.log(`[DOKU Webhook] Order ${order.id} sudah berstatus PAID (Idempotent response).`);
            return { received: true, status: 'already_paid' };
        }
        console.log(`[DOKU Webhook] Memproses invoice: ${rawInvoice} (Order: ${order.id}), status: ${transactionStatus}`);
        if (transactionStatus === 'SUCCESS') {
            await this.processPaymentSuccess(order.id, String(transactionId), transactionDateStr ? new Date(transactionDateStr) : new Date());
        }
        else if (transactionStatus === 'FAILED') {
            if (order.payment) {
                await this.prisma.payment.update({
                    where: { id: order.payment.id },
                    data: { status: client_1.PaymentStatus.FAILED },
                });
            }
            console.log(`[DOKU Webhook] Payment ${order.id} berstatus FAILED, order tetap PENDING sampai expiredAt.`);
        }
        else if (transactionStatus === 'EXPIRED') {
            await this.processPaymentExpired(order.id);
        }
        else if (transactionStatus === 'PENDING') {
            console.log(`[DOKU Webhook] Order ${order.id} menunggu pembayaran (PENDING).`);
        }
        return { received: true };
    }
    async handleMidtransWebhook(body) {
        const { order_id, transaction_status, fraud_status, gross_amount, signature_key, status_code, transaction_id, } = body;
        const serverKey = this.configService.get('TAQTIX_MIDTRANS_SERVER_KEY') || '';
        if (serverKey && signature_key) {
            const rawString = order_id + status_code + gross_amount + serverKey;
            const computedSignature = crypto
                .createHash('sha512')
                .update(rawString)
                .digest('hex');
            if (computedSignature !== signature_key) {
                throw new common_1.BadRequestException('Signature key Midtrans tidak cocok');
            }
        }
        console.log(`[Midtrans Webhook] Verifikasi sukses untuk Order ID: ${order_id}, Status: ${transaction_status}`);
        const isSuccess = transaction_status === 'settlement' ||
            (transaction_status === 'capture' && fraud_status === 'accept');
        const isCancel = transaction_status === 'deny' ||
            transaction_status === 'cancel' ||
            transaction_status === 'expire';
        if (isSuccess) {
            await this.processPaymentSuccess(order_id, transaction_id);
        }
        else if (isCancel) {
            await this.processPaymentFailed(order_id);
        }
        return { received: true };
    }
    async processPaymentSuccess(orderId, transactionId, paidAtDate) {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    orderItems: {
                        include: {
                            ticketCategory: true,
                        },
                    },
                    payment: true,
                    event: true,
                    buyer: true,
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
                        paidAt: paidAtDate || new Date(),
                        externalId: transactionId || order.payment.externalId,
                    },
                });
            }
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.PAID,
                },
            });
            const generatedTickets = [];
            for (const item of order.orderItems) {
                const ticketPerPackage = Number(item.ticketCategory?.ticketPerPackage) || 1;
                const totalTicketsToGenerate = item.qty * ticketPerPackage;
                const answersObj = item.customFieldAnswers || {};
                const packageAttendees = Array.isArray(answersObj.attendees) ? answersObj.attendees : [];
                for (let i = 0; i < totalTicketsToGenerate; i++) {
                    const attendeeInfo = packageAttendees[i] || {};
                    const attendeeName = attendeeInfo.name || item.attendeeName || 'Pengunjung';
                    const attendeeGender = attendeeInfo.gender || answersObj.gender || null;
                    const ticket = await tx.ticket.create({
                        data: {
                            orderItemId: item.id,
                            eventId: order.eventId,
                            status: client_1.TicketStatus.VALID,
                            attendeeName,
                            attendeeGender,
                            qrPayload: 'TEMP_' + crypto.randomUUID(),
                        },
                    });
                    const expSeconds = Math.floor(order.event.endDate.getTime() / 1000);
                    const qrSecret = this.configService.get('QR_SIGNING_SECRET') ||
                        this.configService.get('QR_SECRET') ||
                        'super-secret-qr-key-change-me';
                    const signedCode = await this.jwtService.signAsync({
                        ticketId: ticket.id,
                        eventId: order.eventId,
                        type: 'audience',
                        exp: expSeconds,
                    }, {
                        secret: qrSecret,
                    });
                    const updatedTicket = await tx.ticket.update({
                        where: { id: ticket.id },
                        data: { qrPayload: signedCode },
                        include: {
                            orderItem: {
                                include: {
                                    ticketCategory: true,
                                },
                            },
                        },
                    });
                    generatedTickets.push(updatedTicket);
                }
            }
            if (order.partnerId) {
                const partner = await tx.partner.findUnique({
                    where: { id: order.partnerId },
                });
                if (partner) {
                    const totalQty = order.orderItems.reduce((acc, item) => acc + item.qty, 0);
                    let calculatedCommission = 0;
                    if (partner.commissionType === 'percentage') {
                        calculatedCommission =
                            order.totalAmount * (partner.commissionValue / 100);
                    }
                    else {
                        calculatedCommission = partner.commissionValue * totalQty;
                    }
                    await tx.partner.update({
                        where: { id: partner.id },
                        data: {
                            conversions: { increment: totalQty },
                            revenueGenerated: { increment: order.totalAmount },
                            commissionEarned: { increment: calculatedCommission },
                        },
                    });
                }
            }
            for (const ticket of generatedTickets) {
                const qrUrl = `${this.configService.get('TAQTIX_BASE_URL') || 'https://api.taqtix.id'}/v1/tickets/${ticket.id}`;
                const attendeePhone = ticket.orderItem.attendeePhone;
                const attendeeName = ticket.attendeeName || ticket.orderItem.attendeeName;
                const attendeeEmail = ticket.orderItem.attendeeEmail;
                if (attendeePhone) {
                    await this.notificationsQueue.add('send-ticket-whatsapp', {
                        ticketId: ticket.id,
                        phone: attendeePhone,
                        buyerName: attendeeName,
                        eventTitle: order.event.title,
                        ticketCategory: ticket.orderItem.ticketCategory.name,
                        qrUrl,
                    });
                }
                await this.notificationsQueue.add('send-ticket-email', {
                    ticketId: ticket.id,
                    email: attendeeEmail,
                    buyerName: attendeeName,
                    eventTitle: order.event.title,
                    ticketCategory: ticket.orderItem.ticketCategory.name,
                    qrUrl,
                });
            }
        });
    }
    async processPaymentFailed(orderId) {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
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
                        status: client_1.PaymentStatus.FAILED,
                    },
                });
            }
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                },
            });
            for (const item of order.orderItems) {
                await tx.ticketCategory.update({
                    where: { id: item.ticketCategoryId },
                    data: {
                        sold: { decrement: item.qty },
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
    async processPaymentExpired(orderId) {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    orderItems: true,
                    payment: true,
                },
            });
            if (!order ||
                order.status === client_1.OrderStatus.EXPIRED ||
                order.status === client_1.OrderStatus.CANCELLED ||
                order.status === client_1.OrderStatus.PAID) {
                return;
            }
            if (order.payment) {
                await tx.payment.update({
                    where: { id: order.payment.id },
                    data: {
                        status: client_1.PaymentStatus.EXPIRED,
                    },
                });
            }
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.EXPIRED,
                },
            });
            for (const item of order.orderItems) {
                await tx.ticketCategory.update({
                    where: { id: item.ticketCategoryId },
                    data: {
                        sold: { decrement: item.qty },
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
            console.log(`[DOKU] Order ${orderId} berhasil kedaluwarsa (EXPIRED) dan kuota dikembalikan.`);
        });
    }
    async checkDokuOrderStatus(invoiceNumber) {
        const checkResult = await this.dokuService.checkStatus(invoiceNumber);
        if (!checkResult.success) {
            return checkResult;
        }
        const transactionStatus = String(checkResult.transactionStatus || '').toUpperCase();
        const transactionId = String(checkResult.transactionId || '');
        const transactionDateStr = checkResult.transactionDate;
        const cleanOrderId = invoiceNumber.startsWith('TAQTIX-ORD-')
            ? invoiceNumber.replace('TAQTIX-ORD-', '')
            : invoiceNumber;
        const order = await this.prisma.order.findFirst({
            where: {
                OR: [
                    { id: cleanOrderId },
                    { id: invoiceNumber },
                    { payment: { externalId: invoiceNumber } },
                ],
            },
        });
        if (order && order.status === client_1.OrderStatus.PENDING) {
            if (transactionStatus === 'SUCCESS') {
                await this.processPaymentSuccess(order.id, transactionId, transactionDateStr ? new Date(transactionDateStr) : new Date());
            }
            else if (transactionStatus === 'EXPIRED') {
                await this.processPaymentExpired(order.id);
            }
        }
        return {
            success: true,
            transactionStatus,
            data: checkResult.rawData,
        };
    }
    async handleScheduledStatusCheck() {
        const { clientId, secretKey } = this.getDokuConfig();
        if (!clientId || !secretKey) {
            return;
        }
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        const fifteenMinutesAhead = new Date(now.getTime() + 15 * 60 * 1000);
        const pendingOrders = await this.prisma.order.findMany({
            where: {
                status: client_1.OrderStatus.PENDING,
                expiredAt: {
                    gte: fifteenMinutesAgo,
                    lte: fifteenMinutesAhead,
                },
                payment: {
                    provider: 'doku',
                },
            },
            include: {
                payment: true,
            },
        });
        for (const order of pendingOrders) {
            const invoiceNumber = `TAQTIX-ORD-${order.id}`;
            try {
                await this.checkDokuOrderStatus(invoiceNumber);
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                this.logger.error(`Gagal fallback check status untuk order ${order.id}: ${errorMsg}`);
            }
        }
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
    async getPaymentStatus(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pesanan tidak ditemukan');
        }
        if (order.status === client_1.OrderStatus.PENDING &&
            order.payment?.provider === 'doku' &&
            order.payment?.externalId) {
            const { clientId, secretKey } = this.getDokuConfig();
            if (clientId && secretKey) {
                try {
                    await this.checkDokuOrderStatus(order.payment.externalId);
                    const refreshed = await this.prisma.order.findUnique({
                        where: { id: orderId },
                        include: { payment: true },
                    });
                    if (refreshed) {
                        let status = 'pending';
                        if (refreshed.status === client_1.OrderStatus.PAID)
                            status = 'success';
                        else if (refreshed.status === client_1.OrderStatus.EXPIRED)
                            status = 'expired';
                        else if (refreshed.payment?.status === client_1.PaymentStatus.FAILED)
                            status = 'failed';
                        return { status, expiredAt: refreshed.expiredAt };
                    }
                }
                catch {
                }
            }
        }
        let status = 'pending';
        if (order.payment) {
            if (order.payment.status === client_1.PaymentStatus.SUCCESS ||
                order.status === client_1.OrderStatus.PAID)
                status = 'success';
            else if (order.payment.status === client_1.PaymentStatus.FAILED)
                status = 'failed';
        }
        if (order.status === client_1.OrderStatus.EXPIRED)
            status = 'expired';
        return { status, expiredAt: order.expiredAt };
    }
};
exports.PaymentsService = PaymentsService;
__decorate([
    (0, schedule_1.Cron)('*/3 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsService.prototype, "handleScheduledStatusCheck", null);
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        bullmq_1.Queue,
        doku_service_1.DokuService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map