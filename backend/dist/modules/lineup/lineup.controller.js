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
exports.LineupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lineup_service_1 = require("./lineup.service");
const create_lineup_dto_1 = require("./dto/create-lineup.dto");
const update_lineup_dto_1 = require("./dto/update-lineup.dto");
const reorder_lineup_dto_1 = require("./dto/reorder-lineup.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let LineupController = class LineupController {
    lineupService;
    constructor(lineupService) {
        this.lineupService = lineupService;
    }
    async create(eventId, dto, userId) {
        return this.lineupService.create(eventId, dto, userId);
    }
    async findAll(eventId) {
        return this.lineupService.findAll(eventId);
    }
    async reorder(eventId, dto, userId) {
        return this.lineupService.reorder(eventId, dto, userId);
    }
    async update(eventId, itemId, dto, userId) {
        return this.lineupService.update(eventId, itemId, dto, userId);
    }
    async delete(eventId, itemId, userId) {
        return this.lineupService.delete(eventId, itemId, userId);
    }
};
exports.LineupController = LineupController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan pengisi acara / lineup baru' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Lineup berhasil ditambahkan.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lineup_dto_1.CreateLineupDto, String]),
    __metadata("design:returntype", Promise)
], LineupController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar lineup terurut untuk event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar lineup berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LineupController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah urutan tampil lineup' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Urutan lineup berhasil diperbarui.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_lineup_dto_1.ReorderLineupDto, String]),
    __metadata("design:returntype", Promise)
], LineupController.prototype, "reorder", null);
__decorate([
    (0, common_1.Patch)(':itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengupdate data lineup' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Data lineup berhasil diupdate.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_lineup_dto_1.UpdateLineupDto, String]),
    __metadata("design:returntype", Promise)
], LineupController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':itemId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus lineup' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Lineup berhasil dihapus.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LineupController.prototype, "delete", null);
exports.LineupController = LineupController = __decorate([
    (0, swagger_1.ApiTags)('Line Up (Performers / Artists)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer/events/:id/lineup'),
    __metadata("design:paramtypes", [lineup_service_1.LineupService])
], LineupController);
//# sourceMappingURL=lineup.controller.js.map