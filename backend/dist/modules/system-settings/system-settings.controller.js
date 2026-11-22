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
exports.SystemSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const system_settings_service_1 = require("./system-settings.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let SystemSettingsController = class SystemSettingsController {
    systemSettingsService;
    constructor(systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }
    async getSystemFeatures() {
        const data = await this.systemSettingsService.getAllPlatformFeatures();
        return {
            success: true,
            data,
        };
    }
    async getAdminSettings() {
        const data = await this.systemSettingsService.getAllPlatformFeatures();
        return {
            success: true,
            data,
        };
    }
    async toggleFeature(key, enabled, adminId) {
        const result = await this.systemSettingsService.setFeatureEnabled(key, Boolean(enabled), undefined, adminId);
        return {
            success: true,
            data: {
                key,
                enabled: result,
            },
        };
    }
    async getGuestCheckoutSetting() {
        const enabled = await this.systemSettingsService.isGuestCheckoutFeatureEnabled();
        return {
            success: true,
            data: {
                enabled,
            },
        };
    }
    async updateGuestCheckoutSetting(enabled, adminId) {
        const result = await this.systemSettingsService.setGuestCheckoutFeatureEnabled(Boolean(enabled), adminId);
        return {
            success: true,
            data: {
                enabled: result,
            },
        };
    }
};
exports.SystemSettingsController = SystemSettingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('system/features'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan status feature flags sistem platform' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getSystemFeatures", null);
__decorate([
    (0, common_1.Get)('admin/settings'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan seluruh pengaturan sistem platform (Admin Only)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getAdminSettings", null);
__decorate([
    (0, common_1.Patch)('admin/settings/toggle'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mengubah status toggle fitur platform (Admin Only)',
    }),
    __param(0, (0, common_1.Body)('key')),
    __param(1, (0, common_1.Body)('enabled')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "toggleFeature", null);
__decorate([
    (0, common_1.Get)('admin/settings/guest-checkout'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan status fitur Guest Checkout untuk Event Organizer (Admin Only)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getGuestCheckoutSetting", null);
__decorate([
    (0, common_1.Patch)('admin/settings/guest-checkout'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mengaktifkan / menonaktifkan fitur Guest Checkout untuk Event Organizer (Admin Only)',
    }),
    __param(0, (0, common_1.Body)('enabled')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, String]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "updateGuestCheckoutSetting", null);
exports.SystemSettingsController = SystemSettingsController = __decorate([
    (0, swagger_1.ApiTags)('System Settings & Platform Feature Control'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [system_settings_service_1.SystemSettingsService])
], SystemSettingsController);
//# sourceMappingURL=system-settings.controller.js.map