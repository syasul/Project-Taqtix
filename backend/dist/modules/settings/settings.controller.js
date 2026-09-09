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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getOrganization(userId) {
        const data = await this.settingsService.getOrganization(userId);
        return { success: true, data };
    }
    async updateOrganization(userId, body) {
        const data = await this.settingsService.updateOrganization(userId, body);
        return { success: true, data };
    }
    async getPayment(userId) {
        const data = await this.settingsService.getPayment(userId);
        return { success: true, data };
    }
    async updatePayment(userId, body) {
        const data = await this.settingsService.updatePayment(userId, body);
        return { success: true, data };
    }
    async getIntegrations(userId) {
        const data = await this.settingsService.getIntegrations(userId);
        return { success: true, data };
    }
    async updateIntegrations(userId, body) {
        const data = await this.settingsService.updateIntegrations(userId, body);
        return { success: true, data };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('organization'),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data pengaturan organisasi' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getOrganization", null);
__decorate([
    (0, common_1.Patch)('organization'),
    (0, permissions_decorator_1.Permissions)('edit_organization_settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui data organisasi (Owner Only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateOrganization", null);
__decorate([
    (0, common_1.Get)('payment'),
    (0, permissions_decorator_1.Permissions)('manage_payment_settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data rekening settlement (Owner & Finance Only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Patch)('payment'),
    (0, permissions_decorator_1.Permissions)('manage_payment_settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui data rekening settlement (Owner & Finance Only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.Get)('integrations'),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan ID pixel & tracking integrasi' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getIntegrations", null);
__decorate([
    (0, common_1.Patch)('integrations'),
    (0, permissions_decorator_1.Permissions)('edit_organization_settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui ID pixel & tracking integrasi (Owner Only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateIntegrations", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Organizer Settings'),
    (0, common_1.Controller)('organizer/settings'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map