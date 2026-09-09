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
exports.SettlementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SettlementsService = class SettlementsService {
    prisma;
    timer = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        setTimeout(() => {
            this.calculatePendingSettlements().catch((err) => console.error('[SettlementsService] Error running initial calculation:', err));
        }, 10000);
        this.timer = setInterval(() => {
            this.calculatePendingSettlements().catch((err) => console.error('[SettlementsService] Error running scheduled calculation:', err));
        }, 15 * 60 * 1000);
    }
    async calculatePendingSettlements() {
        const now = new Date();
        const endedEvents = await this.prisma.event.findMany({
            where: {
                OR: [
                    { status: client_1.EventStatus.ENDED },
                    { endDate: { lte: now } },
                ],
                settlements: {
                    none: {},
                },
            },
            include: {
                organizer: true,
                orders: {
                    where: { status: client_1.OrderStatus.PAID },
                },
                partners: true,
            },
        });
        if (endedEvents.length === 0) {
            return { processed: 0, settlements: [] };
        }
        const createdSettlements = [];
        for (const event of endedEvents) {
            const grossRevenue = event.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const affiliateCommissionTotal = event.partners.reduce((sum, partner) => sum + partner.commissionEarned, 0);
            let feeRate = 0.05;
            if (event.organizer?.plan === 'pro')
                feeRate = 0.04;
            if (event.organizer?.plan === 'enterprise')
                feeRate = 0.03;
            const platformFee = Math.round(grossRevenue * feeRate);
            const netAmount = Math.max(0, grossRevenue - platformFee - affiliateCommissionTotal);
            const settlement = await this.prisma.settlement.create({
                data: {
                    organizerId: event.organizerId,
                    eventId: event.id,
                    grossRevenue,
                    platformFee,
                    affiliateCommissionTotal,
                    netAmount,
                    status: 'pending',
                },
            });
            if (event.status !== client_1.EventStatus.ENDED) {
                await this.prisma.event.update({
                    where: { id: event.id },
                    data: { status: client_1.EventStatus.ENDED },
                });
            }
            console.log(`[Settlement Auto-Calculation] Event "${event.title}" diselesaikan. Gross: Rp${grossRevenue.toLocaleString('id-ID')}, Platform Fee: Rp${platformFee.toLocaleString('id-ID')}, Affiliate: Rp${affiliateCommissionTotal.toLocaleString('id-ID')}, Net: Rp${netAmount.toLocaleString('id-ID')}`);
            createdSettlements.push(settlement);
        }
        return {
            processed: createdSettlements.length,
            settlements: createdSettlements,
        };
    }
    async getSettlements() {
        return this.prisma.settlement.findMany({
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        bankAccount: true,
                        phone: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        endDate: true,
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markSettlementPaid(settlementId, adminId) {
        const settlement = await this.prisma.settlement.findUnique({
            where: { id: settlementId },
        });
        if (!settlement) {
            throw new common_1.NotFoundException('Settlement tidak ditemukan');
        }
        if (settlement.status === 'paid') {
            throw new common_1.BadRequestException('Settlement ini sudah berstatus paid');
        }
        const updated = await this.prisma.settlement.update({
            where: { id: settlementId },
            data: {
                status: 'paid',
                paidAt: new Date(),
                paidBy: adminId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                adminId,
                action: 'mark_settlement_paid',
                targetId: settlementId,
                targetType: 'settlement',
                details: {
                    netAmount: settlement.netAmount,
                    eventId: settlement.eventId,
                    organizerId: settlement.organizerId,
                },
            },
        });
        return updated;
    }
};
exports.SettlementsService = SettlementsService;
exports.SettlementsService = SettlementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettlementsService);
//# sourceMappingURL=settlements.service.js.map