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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const create_ticket_category_dto_1 = require("./dto/create-ticket-category.dto");
const update_ticket_category_dto_1 = require("./dto/update-ticket-category.dto");
const create_promo_code_dto_1 = require("./dto/create-promo-code.dto");
const validate_promo_code_dto_1 = require("./dto/validate-promo-code.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let TicketsController = class TicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    async getCategories(eventId) {
        return this.ticketsService.getCategories(eventId);
    }
    async createCategory(eventId, dto, userId) {
        return this.ticketsService.createCategory(eventId, dto, userId);
    }
    async updateCategory(id, dto, userId) {
        return this.ticketsService.updateCategory(id, dto, userId);
    }
    async createPromoCode(eventId, dto, userId) {
        return this.ticketsService.createPromoCode(eventId, dto, userId);
    }
    async validatePromoCode(dto) {
        return this.ticketsService.validatePromoCode(dto);
    }
    async getTicket(ticketId) {
        return this.ticketsService.getTicket(ticketId);
    }
    async getTicketsByOrder(orderId) {
        return this.ticketsService.getTicketsByOrder(orderId);
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('events/:id/ticket-categories'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan daftar kategori tiket suatu event (Public)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Kategori tiket berhasil diambil.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Event tidak ditemukan.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('organizer/events/:id/ticket-categories'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat kategori tiket baru untuk event (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Kategori tiket berhasil dibuat.',
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Akses ditolak.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_ticket_category_dto_1.CreateTicketCategoryDto, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('organizer/ticket-categories/:id'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah kategori tiket (Organizer Only)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Kategori tiket berhasil diperbarui.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Kategori tiket tidak ditemukan.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ticket_category_dto_1.UpdateTicketCategoryDto, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Post)('events/:id/promo-codes'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat kode promo baru untuk event (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Kode promo berhasil dibuat.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Kode promo sudah terdaftar.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_promo_code_dto_1.CreatePromoCodeDto, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "createPromoCode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('orders/validate-promo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validasi kode promo (Public/Buyer)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Status keabsahan kode promo.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Kode promo tidak valid atau kuota habis.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_promo_code_dto_1.ValidatePromoCodeDto]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "validatePromoCode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tickets/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan detail e-ticket pembeli berdasarkan ID tiket (Public/Buyer)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Detail e-ticket berhasil didapatkan.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Tiket tidak ditemukan.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getTicket", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tickets/by-order/:orderId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan daftar tiket elektronik berdasarkan ID pesanan (Public/Buyer)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Daftar e-ticket berhasil didapatkan.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pesanan tidak ditemukan.',
    }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getTicketsByOrder", null);
exports.TicketsController = TicketsController = __decorate([
    (0, swagger_1.ApiTags)('Tickets & Promo'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map