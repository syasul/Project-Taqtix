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
exports.RundownController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rundown_service_1 = require("./rundown.service");
const create_rundown_dto_1 = require("./dto/create-rundown.dto");
const update_rundown_dto_1 = require("./dto/update-rundown.dto");
const reorder_rundown_dto_1 = require("./dto/reorder-rundown.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let RundownController = class RundownController {
    rundownService;
    constructor(rundownService) {
        this.rundownService = rundownService;
    }
    async create(eventId, dto, userId) {
        const data = await this.rundownService.create(eventId, dto, userId);
        return { success: true, data };
    }
    async findAll(eventId) {
        const data = await this.rundownService.findAll(eventId);
        return { success: true, data };
    }
    async reorder(eventId, dto, userId) {
        const data = await this.rundownService.reorder(eventId, dto, userId);
        return { success: true, data };
    }
    async update(eventId, itemId, dto, userId) {
        const data = await this.rundownService.update(eventId, itemId, dto, userId);
        return { success: true, data };
    }
    async delete(eventId, itemId, userId) {
        return this.rundownService.delete(eventId, itemId, userId);
    }
};
exports.RundownController = RundownController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan sesi agenda rundown baru' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Agenda berhasil ditambahkan.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_rundown_dto_1.CreateRundownDto, String]),
    __metadata("design:returntype", Promise)
], RundownController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar susunan rundown acara' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Daftar rundown berhasil diambil.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RundownController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah urutan tampil susunan rundown' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Urutan rundown berhasil diperbarui.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_rundown_dto_1.ReorderRundownDto, String]),
    __metadata("design:returntype", Promise)
], RundownController.prototype, "reorder", null);
__decorate([
    (0, common_1.Patch)(':itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui rincian agenda rundown' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rundown berhasil diperbarui.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_rundown_dto_1.UpdateRundownDto, String]),
    __metadata("design:returntype", Promise)
], RundownController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':itemId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus sesi agenda dari susunan rundown' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Agenda berhasil dihapus.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RundownController.prototype, "delete", null);
exports.RundownController = RundownController = __decorate([
    (0, swagger_1.ApiTags)('Rundown & Agenda'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer/events/:id/rundown'),
    __metadata("design:paramtypes", [rundown_service_1.RundownService])
], RundownController);
//# sourceMappingURL=rundown.controller.js.map