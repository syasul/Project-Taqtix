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
exports.CustomFieldsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const custom_fields_service_1 = require("./custom-fields.service");
const create_custom_field_dto_1 = require("./dto/create-custom-field.dto");
const update_custom_field_dto_1 = require("./dto/update-custom-field.dto");
const reorder_custom_fields_dto_1 = require("./dto/reorder-custom-fields.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let CustomFieldsController = class CustomFieldsController {
    customFieldsService;
    constructor(customFieldsService) {
        this.customFieldsService = customFieldsService;
    }
    async create(eventId, dto, userId) {
        return this.customFieldsService.create(eventId, dto, userId);
    }
    async findAll(eventId) {
        return this.customFieldsService.findAll(eventId);
    }
    async reorder(eventId, dto, userId) {
        return this.customFieldsService.reorder(eventId, dto, userId);
    }
    async update(eventId, fieldId, dto, userId) {
        return this.customFieldsService.update(eventId, fieldId, dto, userId);
    }
    async delete(eventId, fieldId, userId) {
        return this.customFieldsService.delete(eventId, fieldId, userId);
    }
};
exports.CustomFieldsController = CustomFieldsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan field formulir baru untuk event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Field formulir berhasil ditambahkan.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_custom_field_dto_1.CreateCustomFieldDto, String]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar field formulir untuk event' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar field formulir berhasil diambil.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah urutan tampilan field formulir' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Urutan field formulir berhasil diperbarui.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_custom_fields_dto_1.ReorderCustomFieldsDto, String]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "reorder", null);
__decorate([
    (0, common_1.Patch)(':fieldId'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengupdate field formulir' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Field formulir berhasil diupdate.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_custom_field_dto_1.UpdateCustomFieldDto, String]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':fieldId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus field formulir' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Field formulir berhasil dihapus.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomFieldsController.prototype, "delete", null);
exports.CustomFieldsController = CustomFieldsController = __decorate([
    (0, swagger_1.ApiTags)('Custom Form Fields (Formulir Tambahan)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer/events/:id/custom-fields'),
    __metadata("design:paramtypes", [custom_fields_service_1.CustomFieldsService])
], CustomFieldsController);
//# sourceMappingURL=custom-fields.controller.js.map