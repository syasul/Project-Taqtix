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
exports.ApiV1Controller = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_auth_guard_1 = require("../../common/guards/api-key-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let ApiV1Controller = class ApiV1Controller {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEvents(req) {
        const organizer = req.organizer;
        const events = await this.prisma.event.findMany({
            where: { organizerId: organizer.id },
            include: {
                ticketCategories: true,
            },
            orderBy: { startDate: 'desc' },
        });
        return {
            success: true,
            organizer: { id: organizer.id, name: organizer.name },
            count: events.length,
            data: events,
        };
    }
    async getOrders(req, eventId) {
        const organizer = req.organizer;
        const where = {
            event: {
                organizerId: organizer.id,
            },
        };
        if (eventId) {
            where.eventId = eventId;
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: {
                orderItems: {
                    include: {
                        ticketCategory: true,
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: orders.length,
            data: orders,
        };
    }
    async getAttendance(req, eventId) {
        const organizer = req.organizer;
        const where = {
            event: {
                organizerId: organizer.id,
            },
        };
        if (eventId) {
            where.eventId = eventId;
        }
        const tickets = await this.prisma.ticket.findMany({
            where,
            include: {
                orderItem: {
                    include: {
                        ticketCategory: true,
                    },
                },
                staff: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: tickets.length,
            data: tickets.map((t) => ({
                ticketId: t.id,
                eventId: t.eventId,
                attendeeName: t.orderItem.attendeeName,
                attendeeEmail: t.orderItem.attendeeEmail,
                ticketCategory: t.orderItem.ticketCategory.name,
                status: t.status,
                checkedInAt: t.checkedInAt,
                wristbandCode: t.wristbandCode,
                isBlocked: t.isBlocked,
            })),
        };
    }
};
exports.ApiV1Controller = ApiV1Controller;
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar event milik organizer (Public API v1)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar event berhasil diambil.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiV1Controller.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar pesanan tiket (Public API v1)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar pesanan berhasil diambil.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiV1Controller.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('attendance'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar kehadiran / scan log (Public API v1)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar kehadiran berhasil diambil.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiV1Controller.prototype, "getAttendance", null);
exports.ApiV1Controller = ApiV1Controller = __decorate([
    (0, swagger_1.ApiTags)('Public External API v1 (X-API-Key)'),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(api_key_auth_guard_1.ApiKeyAuthGuard),
    (0, swagger_1.ApiHeader)({
        name: 'X-API-Key',
        description: 'Secret API key format: taq_live_xxxxxxxx',
        required: true,
    }),
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiV1Controller);
//# sourceMappingURL=api-v1.controller.js.map