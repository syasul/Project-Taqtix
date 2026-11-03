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
exports.BannersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const banners_service_1 = require("./banners.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const create_banner_dto_1 = require("./dto/create-banner.dto");
const update_banner_dto_1 = require("./dto/update-banner.dto");
let BannersController = class BannersController {
    bannersService;
    constructor(bannersService) {
        this.bannersService = bannersService;
    }
    async getPublicBanners(position) {
        const banners = await this.bannersService.getPublicBanners(position);
        return { success: true, data: banners };
    }
    async getAdminBanners() {
        const banners = await this.bannersService.getAdminBanners();
        return { success: true, data: banners };
    }
    async createBanner(dto) {
        const banner = await this.bannersService.createBanner(dto);
        return { success: true, data: banner };
    }
    async updateBanner(id, dto) {
        const banner = await this.bannersService.updateBanner(id, dto);
        return { success: true, data: banner };
    }
    async deleteBanner(id) {
        const result = await this.bannersService.deleteBanner(id);
        return { success: true, data: result };
    }
};
exports.BannersController = BannersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('banners'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar banner slider aktif untuk landing page (Publik)' }),
    (0, swagger_1.ApiQuery)({ name: 'position', required: false, description: 'Filter posisi banner (default: home_hero)' }),
    __param(0, (0, common_1.Query)('position')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BannersController.prototype, "getPublicBanners", null);
__decorate([
    (0, common_1.Get)('admin/banners'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan semua banner untuk dikelola Main Admin (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BannersController.prototype, "getAdminBanners", null);
__decorate([
    (0, common_1.Post)('admin/banners'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan banner slider promosi baru (Admin Only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_banner_dto_1.CreateBannerDto]),
    __metadata("design:returntype", Promise)
], BannersController.prototype, "createBanner", null);
__decorate([
    (0, common_1.Patch)('admin/banners/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui data banner slider (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_banner_dto_1.UpdateBannerDto]),
    __metadata("design:returntype", Promise)
], BannersController.prototype, "updateBanner", null);
__decorate([
    (0, common_1.Delete)('admin/banners/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus banner slider (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BannersController.prototype, "deleteBanner", null);
exports.BannersController = BannersController = __decorate([
    (0, swagger_1.ApiTags)('Banners Promosi'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [banners_service_1.BannersService])
], BannersController);
//# sourceMappingURL=banners.controller.js.map