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
exports.DoorprizeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const doorprize_service_1 = require("./doorprize.service");
const create_doorprize_dto_1 = require("./dto/create-doorprize.dto");
const draw_doorprize_dto_1 = require("./dto/draw-doorprize.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let DoorprizeController = class DoorprizeController {
    doorprizeService;
    constructor(doorprizeService) {
        this.doorprizeService = doorprizeService;
    }
    async createItem(eventId, dto, userId) {
        return this.doorprizeService.createItem(eventId, dto, userId);
    }
    async listItems(eventId, userId) {
        return this.doorprizeService.listItems(eventId, userId);
    }
    async drawWinner(eventId, itemId, dto, userId) {
        return this.doorprizeService.drawWinner(eventId, itemId, dto, userId);
    }
    async listWinners(eventId, userId) {
        return this.doorprizeService.listWinners(eventId, userId);
    }
};
exports.DoorprizeController = DoorprizeController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan item hadiah doorprize baru' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Hadiah doorprize berhasil ditambahkan.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_doorprize_dto_1.CreateDoorprizeDto, String]),
    __metadata("design:returntype", Promise)
], DoorprizeController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar hadiah doorprize' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar hadiah berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DoorprizeController.prototype, "listItems", null);
__decorate([
    (0, common_1.Post)(':itemId/draw'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengundi pemenang doorprize dari pengunjung yang sudah Check-In' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Pengundian pemenang berhasil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, draw_doorprize_dto_1.DrawDoorprizeDto, String]),
    __metadata("design:returntype", Promise)
], DoorprizeController.prototype, "drawWinner", null);
__decorate([
    (0, common_1.Get)('winners'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar semua pemenang doorprize' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar pemenang berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DoorprizeController.prototype, "listWinners", null);
exports.DoorprizeController = DoorprizeController = __decorate([
    (0, swagger_1.ApiTags)('Doorprize'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer/events/:id/doorprize'),
    __metadata("design:paramtypes", [doorprize_service_1.DoorprizeService])
], DoorprizeController);
//# sourceMappingURL=doorprize.controller.js.map