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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto = __importStar(require("crypto"));
let TransfersService = class TransfersService {
    prisma;
    configService;
    jwtService;
    constructor(prisma, configService, jwtService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
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
    async requestTransfer(ticketId, dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                event: true,
                orderItem: true,
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Tiket tidak ditemukan');
        }
        if (!ticket.event.allowTicketTransfer) {
            throw new common_1.ForbiddenException('Fitur transfer tiket dinonaktifkan oleh penyelenggara untuk event ini.');
        }
        if (ticket.status !== 'VALID') {
            throw new common_1.BadRequestException('Hanya tiket dengan status VALID yang dapat ditransfer.');
        }
        if (ticket.isBlocked) {
            throw new common_1.ForbiddenException('Tiket telah diblokir dan tidak dapat ditransfer.');
        }
        const existingPending = await this.prisma.ticketTransfer.findFirst({
            where: {
                ticketId,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
        });
        if (existingPending) {
            throw new common_1.BadRequestException('Tiket ini sedang dalam proses transfer yang belum selesai.');
        }
        const requestToken = crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const invalidatedQr = `TRANSFER_PENDING_${crypto.randomBytes(16).toString('hex')}`;
        return this.prisma.$transaction(async (tx) => {
            await tx.ticket.update({
                where: { id: ticketId },
                data: {
                    qrPayload: invalidatedQr,
                    status: 'TRANSFER_PENDING',
                },
            });
            return tx.ticketTransfer.create({
                data: {
                    ticketId,
                    fromEmail: ticket.orderItem.attendeeEmail,
                    toName: dto.toName,
                    toEmail: dto.toEmail,
                    toPhone: dto.toPhone,
                    requestToken,
                    expiresAt,
                    status: 'pending',
                },
            });
        });
    }
    async confirmTransfer(requestToken) {
        const transfer = await this.prisma.ticketTransfer.findUnique({
            where: { requestToken },
            include: {
                ticket: {
                    include: {
                        orderItem: true,
                        event: true,
                    },
                },
            },
        });
        if (!transfer) {
            throw new common_1.NotFoundException('Permintaan transfer tidak ditemukan');
        }
        if (transfer.status !== 'pending') {
            throw new common_1.BadRequestException(`Transfer sudah berstatus ${transfer.status}`);
        }
        if (new Date() > transfer.expiresAt) {
            await this.prisma.ticketTransfer.update({
                where: { id: transfer.id },
                data: { status: 'expired' },
            });
            throw new common_1.BadRequestException('Permintaan transfer sudah kedaluwarsa');
        }
        const newQrPayload = await this.generateQrPayload(transfer.ticket.id, transfer.ticket.eventId);
        return this.prisma.$transaction(async (tx) => {
            const updatedTicket = await tx.ticket.update({
                where: { id: transfer.ticket.id },
                data: {
                    qrPayload: newQrPayload,
                    status: 'VALID',
                },
            });
            await tx.orderItem.update({
                where: { id: transfer.ticket.orderItemId },
                data: {
                    attendeeName: transfer.toName,
                    attendeeEmail: transfer.toEmail,
                    attendeePhone: transfer.toPhone,
                },
            });
            const completedTransfer = await tx.ticketTransfer.update({
                where: { id: transfer.id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                },
            });
            return {
                success: true,
                message: 'Transfer tiket berhasil diselesaikan',
                transfer: completedTransfer,
                ticket: updatedTicket,
            };
        });
    }
    async declineTransfer(requestToken) {
        const transfer = await this.prisma.ticketTransfer.findUnique({
            where: { requestToken },
            include: { ticket: true },
        });
        if (!transfer) {
            throw new common_1.NotFoundException('Permintaan transfer tidak ditemukan');
        }
        if (transfer.status !== 'pending') {
            throw new common_1.BadRequestException(`Transfer sudah berstatus ${transfer.status}`);
        }
        const restoredQr = await this.generateQrPayload(transfer.ticket.id, transfer.ticket.eventId);
        return this.prisma.$transaction(async (tx) => {
            await tx.ticket.update({
                where: { id: transfer.ticket.id },
                data: {
                    qrPayload: restoredQr,
                    status: 'VALID',
                },
            });
            return tx.ticketTransfer.update({
                where: { id: transfer.id },
                data: { status: 'cancelled' },
            });
        });
    }
    async handleExpiredTransfers() {
        const expiredTransfers = await this.prisma.ticketTransfer.findMany({
            where: {
                status: 'pending',
                expiresAt: { lt: new Date() },
            },
            include: { ticket: true },
        });
        for (const t of expiredTransfers) {
            const restoredQr = await this.generateQrPayload(t.ticket.id, t.ticket.eventId);
            await this.prisma.$transaction([
                this.prisma.ticket.update({
                    where: { id: t.ticketId },
                    data: {
                        qrPayload: restoredQr,
                        status: 'VALID',
                    },
                }),
                this.prisma.ticketTransfer.update({
                    where: { id: t.id },
                    data: { status: 'expired' },
                }),
            ]);
        }
        return { processedCount: expiredTransfers.length };
    }
    async listEventTransfers(eventId) {
        return this.prisma.ticketTransfer.findMany({
            where: {
                ticket: {
                    eventId,
                },
            },
            include: {
                ticket: {
                    include: {
                        orderItem: {
                            include: {
                                ticketCategory: true,
                            },
                        },
                    },
                },
            },
            orderBy: { requestedAt: 'desc' },
        });
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map