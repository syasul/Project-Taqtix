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
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pos_service_1 = require("./pos.service");
const create_pos_transaction_dto_1 = require("./dto/create-pos-transaction.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let PosController = class PosController {
    posService;
    constructor(posService) {
        this.posService = posService;
    }
    async createTransaction(eventId, dto, userId) {
        return this.posService.createTransaction(eventId, dto, userId);
    }
    async listTransactions(eventId, userId) {
        return this.posService.listTransactions(eventId, userId);
    }
    async getSummary(eventId, userId) {
        return this.posService.getSummary(eventId, userId);
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Post)('transaction'),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat transaksi pembelian langsung di POS (on-site)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Transaksi POS berhasil diproses.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pos_transaction_dto_1.CreatePosTransactionDto, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar transaksi POS pada event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar transaksi POS berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan ringkasan penjualan POS' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Ringkasan POS berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getSummary", null);
exports.PosController = PosController = __decorate([
    (0, swagger_1.ApiTags)('Point of Sales (POS)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member', 'gate_staff'),
    (0, common_1.Controller)('organizer/events/:id/pos'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map