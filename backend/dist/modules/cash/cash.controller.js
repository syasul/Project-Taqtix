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
exports.CashController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cash_service_1 = require("./cash.service");
const create_cash_transaction_dto_1 = require("./dto/create-cash-transaction.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let CashController = class CashController {
    cashService;
    constructor(cashService) {
        this.cashService = cashService;
    }
    async getOrganizerCashSummary(userId) {
        return this.cashService.getOrganizerCashSummary(userId);
    }
    async recordCash(eventId, dto, userId) {
        return this.cashService.recordCash(eventId, dto, userId);
    }
    async getEventCash(eventId, userId) {
        return this.cashService.getEventCash(eventId, userId);
    }
};
exports.CashController = CashController;
__decorate([
    (0, common_1.Get)('cash/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan ringkasan kas org-level lintas seluruh event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Summary kas organisasi berhasil diambil.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashController.prototype, "getOrganizerCashSummary", null);
__decorate([
    (0, common_1.Post)('events/:id/cash'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat transaksi cash manual untuk 1 event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Transaksi kas berhasil dicatat.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cash_transaction_dto_1.CreateCashTransactionDto, String]),
    __metadata("design:returntype", Promise)
], CashController.prototype, "recordCash", null);
__decorate([
    (0, common_1.Get)('events/:id/cash'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan riwayat transaksi kas untuk 1 event beserta totalCashIn' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Riwayat kas event berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashController.prototype, "getEventCash", null);
exports.CashController = CashController = __decorate([
    (0, swagger_1.ApiTags)('Cash Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer'),
    __metadata("design:paramtypes", [cash_service_1.CashService])
], CashController);
//# sourceMappingURL=cash.controller.js.map