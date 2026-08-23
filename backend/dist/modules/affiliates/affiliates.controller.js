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
exports.AffiliatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const affiliates_service_1 = require("./affiliates.service");
const create_affiliate_dto_1 = require("./dto/create-affiliate.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AffiliatesController = class AffiliatesController {
    affiliatesService;
    constructor(affiliatesService) {
        this.affiliatesService = affiliatesService;
    }
    async redirectAffiliate(code, req, res) {
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || undefined;
        const userAgent = req.headers['user-agent'] || undefined;
        const redirectUrl = await this.affiliatesService.registerClickAndGetUrl(code, ipAddress, userAgent);
        return res.redirect(redirectUrl);
    }
    async trackClick(code, req) {
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || undefined;
        const userAgent = req.headers['user-agent'] || undefined;
        await this.affiliatesService.registerClickAndGetUrl(code, ipAddress, userAgent);
        return { success: true };
    }
    async createAffiliate(eventId, dto, userId) {
        return this.affiliatesService.create(eventId, dto, userId);
    }
    async getAffiliates(eventId, userId) {
        return this.affiliatesService.findAll(eventId, userId);
    }
    async getLeaderboard(eventId, userId) {
        return this.affiliatesService.getLeaderboard(eventId, userId);
    }
    async requestMagicLink(email) {
        const result = await this.affiliatesService.requestMagicLink(email);
        return result;
    }
    async verifyMagicLink(token) {
        const result = await this.affiliatesService.verifyMagicLink(token);
        return { success: true, data: result };
    }
    async getPartnerStats(partnerId) {
        const result = await this.affiliatesService.getPartnerStats(partnerId);
        return { success: true, data: result };
    }
};
exports.AffiliatesController = AffiliatesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('r/:code'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mencatat klik afiliasi dan redirect ke landing page event (Public)',
    }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "redirectAffiliate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('track/click/:partnerCode'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat klik afiliasi via API (Public)' }),
    __param(0, (0, common_1.Param)('partnerCode')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "trackClick", null);
__decorate([
    (0, common_1.Post)('organizer/events/:id/partners'),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendaftarkan partner afiliasi baru (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Partner afiliasi berhasil terdaftar.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_affiliate_dto_1.CreateAffiliateDto, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "createAffiliate", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/partners'),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan daftar partner afiliasi event (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Daftar partner afiliasi.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "getAffiliates", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/partners/leaderboard'),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan leaderboard penjualan partner afiliasi (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Leaderboard partner afiliasi.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Post)('partner/auth/request-magic-link'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Meminta login magic link untuk partner' }),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "requestMagicLink", null);
__decorate([
    (0, common_1.Post)('partner/auth/verify-magic-link'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verifikasi magic link token dan berikan JWT' }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "verifyMagicLink", null);
__decorate([
    (0, common_1.Get)('partner/stats'),
    (0, roles_decorator_1.Roles)('partner'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data analitik performa partner' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "getPartnerStats", null);
exports.AffiliatesController = AffiliatesController = __decorate([
    (0, swagger_1.ApiTags)('Partners & Affiliates'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [affiliates_service_1.AffiliatesService])
], AffiliatesController);
//# sourceMappingURL=affiliates.controller.js.map