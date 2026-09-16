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
var DokuService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DokuService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const doku_config_1 = require("./doku.config");
const doku_signature_util_1 = require("./doku-signature.util");
let DokuService = DokuService_1 = class DokuService {
    configService;
    logger = new common_1.Logger(DokuService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    getConfig() {
        return (0, doku_config_1.getDokuConfig)(this.configService);
    }
    async createPayment(order, payment, customFrontendUrl) {
        const { clientId, secretKey, baseUrl } = this.getConfig();
        if (!clientId || !secretKey) {
            throw new common_1.BadRequestException('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi');
        }
        const requestTarget = '/checkout/v1/payment';
        const requestId = crypto.randomUUID();
        const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';
        const firstItem = order.orderItems?.[0];
        const buyerName = firstItem?.attendeeName || order.buyer?.name || 'Customer';
        const buyerEmail = order.buyer?.email || firstItem?.attendeeEmail || '';
        const buyerPhone = firstItem?.attendeePhone || order.buyer?.phone || '';
        let formattedPhone = buyerPhone ? String(buyerPhone).trim() : '';
        if (formattedPhone.startsWith('08')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }
        else if (formattedPhone.startsWith('+62')) {
            formattedPhone = formattedPhone.substring(1);
        }
        const frontendUrl = customFrontendUrl ||
            this.configService.get('TAQTIX_FRONTEND_URL') ||
            this.configService.get('TAQTIX_WEB_URL') ||
            'https://taqtix.id';
        const invoiceNumber = `TAQTIX-ORD-${order.id}`;
        const payload = {
            order: {
                amount: Math.round(order.totalAmount),
                invoice_number: invoiceNumber,
                callback_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
                callback_url_cancel: `${frontendUrl}/checkout/cancelled?orderId=${order.id}`,
                auto_redirect: true,
                line_items: order.orderItems?.map((item) => ({
                    name: (item.ticketCategory?.name || 'Tiket Event').substring(0, 50),
                    price: Math.round(item.unitPrice),
                    quantity: item.qty,
                })) || [],
            },
            payment: {
                payment_due_date: 10,
            },
            customer: {
                id: order.buyerId || order.buyer?.id || order.id,
                name: buyerName,
                email: buyerEmail,
                phone: formattedPhone || undefined,
                country: 'ID',
            },
        };
        const bodyString = JSON.stringify(payload);
        const signature = (0, doku_signature_util_1.generateSignature)({
            secretKey,
            clientId,
            requestId,
            timestamp: requestTimestamp,
            requestTarget,
            bodyString,
        });
        try {
            const response = await fetch(`${baseUrl}${requestTarget}`, {
                method: 'POST',
                headers: {
                    'Client-Id': clientId,
                    'Request-Id': requestId,
                    'Request-Timestamp': requestTimestamp,
                    Signature: signature,
                    'Content-Type': 'application/json',
                },
                body: bodyString,
            });
            const data = await response.json();
            if (!response.ok) {
                this.logger.error('DOKU Create Payment Error response:', data);
                throw new common_1.BadRequestException(data?.message ||
                    data?.error?.message ||
                    'Gagal menghubungi payment gateway DOKU');
            }
            const paymentUrl = data?.response?.payment?.url || data?.payment?.url || '';
            const tokenId = data?.response?.payment?.token_id || data?.payment?.token_id || '';
            const expiredDateRaw = data?.response?.payment?.expired_date ||
                data?.payment?.expired_date ||
                '';
            const expiredDate = expiredDateRaw
                ? (0, doku_signature_util_1.parseDokuExpiredDate)(expiredDateRaw)
                : null;
            return {
                paymentUrl,
                tokenId,
                expiredDate,
                invoiceNumber,
            };
        }
        catch (err) {
            this.logger.error('Gagal memproses Create Payment DOKU:', err);
            throw new common_1.BadRequestException(err.message || 'Gagal memproses pembayaran DOKU');
        }
    }
    verifyWebhookSignature(headers, rawBody, requestPath) {
        const { clientId: configuredClientId, secretKey, isProduction, } = this.getConfig();
        if (!secretKey) {
            if (isProduction) {
                throw new common_1.UnauthorizedException('DOKU Secret Key belum dikonfigurasi di server production');
            }
            return true;
        }
        const incomingSignature = headers['signature'] ||
            headers['Signature'] ||
            headers['SIGNATURE'] ||
            '';
        const clientId = headers['client-id'] ||
            headers['Client-Id'] ||
            headers['CLIENT-ID'] ||
            configuredClientId;
        const requestId = headers['request-id'] ||
            headers['Request-Id'] ||
            headers['REQUEST-ID'] ||
            '';
        const timestamp = headers['request-timestamp'] ||
            headers['Request-Timestamp'] ||
            headers['REQUEST-TIMESTAMP'] ||
            '';
        const requestTarget = headers['request-target'] ||
            headers['Request-Target'] ||
            (requestPath ? requestPath.split('?')[0] : '/payments/webhook/doku');
        let bodyString = '';
        if (rawBody) {
            bodyString = Buffer.isBuffer(rawBody)
                ? rawBody.toString('utf8')
                : String(rawBody);
        }
        return (0, doku_signature_util_1.verifySignature)({
            secretKey,
            clientId,
            requestId,
            timestamp,
            requestTarget,
            bodyString,
            incomingSignature,
        });
    }
    async checkStatus(invoiceNumber) {
        const { clientId, secretKey, baseUrl } = this.getConfig();
        if (!clientId || !secretKey) {
            throw new common_1.BadRequestException('Kredensial DOKU belum dikonfigurasi');
        }
        const requestTarget = `/orders/v1/status/${invoiceNumber}`;
        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString().slice(0, 19) + 'Z';
        const signature = (0, doku_signature_util_1.generateSignature)({
            secretKey,
            clientId,
            requestId,
            timestamp,
            requestTarget,
        });
        try {
            const response = await fetch(`${baseUrl}${requestTarget}`, {
                method: 'GET',
                headers: {
                    'Client-Id': clientId,
                    'Request-Id': requestId,
                    'Request-Timestamp': timestamp,
                    Signature: signature,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                this.logger.error('DOKU Check Status Error response:', data);
                return { success: false, rawData: data };
            }
            const transactionStatus = String(data?.transaction?.status || data?.status || '').toUpperCase();
            const transactionId = String(data?.transaction?.id || data?.order?.session_id || '');
            const transactionDate = data?.transaction?.date;
            return {
                success: true,
                transactionStatus,
                transactionId,
                transactionDate,
                rawData: data,
            };
        }
        catch (err) {
            this.logger.error('Gagal memanggil DOKU Check Status API:', err);
            return { success: false, error: err.message };
        }
    }
};
exports.DokuService = DokuService;
exports.DokuService = DokuService = DokuService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DokuService);
//# sourceMappingURL=doku.service.js.map