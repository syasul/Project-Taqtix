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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transfers_service_1 = require("./transfers.service");
const request_transfer_dto_1 = require("./dto/request-transfer.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let TransfersController = class TransfersController {
    transfersService;
    constructor(transfersService) {
        this.transfersService = transfersService;
    }
    async requestTransfer(ticketId, dto) {
        return this.transfersService.requestTransfer(ticketId, dto);
    }
    async confirmTransfer(requestToken) {
        return this.transfersService.confirmTransfer(requestToken);
    }
    async declineTransfer(requestToken) {
        return this.transfersService.declineTransfer(requestToken);
    }
    async listEventTransfers(eventId) {
        return this.transfersService.listEventTransfers(eventId);
    }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tickets/:id/transfer'),
    (0, swagger_1.ApiOperation)({ summary: 'Pemilik tiket mengajukan permintaan transfer kepemilikan' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Permintaan transfer berhasil dibuat.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_transfer_dto_1.RequestTransferDto]),
    __metadata("design:returntype", Promise)
], TransfersController.prototype, "requestTransfer", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tickets/transfer/:requestToken/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Penerima mengonfirmasi dan menerima transfer tiket' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Transfer tiket berhasil dikonfirmasi.' }),
    __param(0, (0, common_1.Param)('requestToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransfersController.prototype, "confirmTransfer", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('tickets/transfer/:requestToken/decline'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menolak atau membatalkan permintaan transfer tiket' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Transfer tiket dibatalkan.' }),
    __param(0, (0, common_1.Param)('requestToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransfersController.prototype, "declineTransfer", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Get)('organizer/events/:id/transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar histori transfer tiket pada event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Histori transfer tiket berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransfersController.prototype, "listEventTransfers", null);
exports.TransfersController = TransfersController = __decorate([
    (0, swagger_1.ApiTags)('Ticket Transfers'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], TransfersController);
//# sourceMappingURL=transfers.controller.js.map