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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getOverview(userId) {
        const result = await this.dashboardService.getOverview(userId);
        return { success: true, data: result };
    }
    async getEventDashboard(eventId, userId) {
        return this.dashboardService.getEventDashboard(eventId, userId);
    }
    async getBuyers(eventId, userId) {
        return this.dashboardService.getBuyers(eventId, userId);
    }
    async exportBuyers(eventId, userId, res) {
        const csvContent = await this.dashboardService.getBuyersCsv(eventId, userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="buyers-event-${eventId}.csv"`);
        return res.status(common_1.HttpStatus.OK).send(csvContent);
    }
    async getChannelPerformance(eventId, userId) {
        return this.dashboardService.getChannelPerformance(eventId, userId);
    }
    async getSalesAnalytics(eventId, userId) {
        const result = await this.dashboardService.getSalesAnalytics(eventId, userId);
        return { success: true, data: result };
    }
    async getDistributionAnalytics(eventId, userId) {
        const result = await this.dashboardService.getDistributionAnalytics(eventId, userId);
        return { success: true, data: result };
    }
    async getAudienceAnalytics(eventId, userId) {
        const result = await this.prismaGetAudience(eventId, userId);
        return { success: true, data: result };
    }
    async prismaGetAudience(eventId, userId) {
        return this.dashboardService.getAudienceAnalytics(eventId, userId);
    }
    async getPerformanceAnalytics(eventId, userId) {
        const result = await this.dashboardService.getPerformanceAnalytics(eventId, userId);
        return { success: true, data: result };
    }
    async recordAdSpend(eventId, dto, userId) {
        const result = await this.dashboardService.recordAdSpend(eventId, dto, userId);
        return { success: true, data: result };
    }
    async getGrowthDashboard(eventId, userId) {
        const result = await this.dashboardService.getGrowthDashboard(eventId, userId);
        return { success: true, data: result };
    }
    async trackPageView(eventId) {
        await this.dashboardService.trackEvent(eventId, 'page_view');
        return { success: true };
    }
    async trackCheckoutStarted(eventId) {
        await this.dashboardService.trackEvent(eventId, 'checkout_start');
        return { success: true };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('organizer/overview'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan rangkuman eksekutif multi-event organizer (Cached)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan rangkuman metrik utama dashboard event' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEventDashboard", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/buyers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan database pembeli tiket event' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBuyers", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/buyers/export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengekspor data pembeli tiket ke file CSV' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportBuyers", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/channel-performance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_analytics_growth'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data atribusi performa marketing channel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getChannelPerformance", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/analytics/sales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan laporan analitik penjualan' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSalesAnalytics", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/analytics/distribution'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan laporan analitik distribusi marketing' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDistributionAnalytics", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/analytics/audience'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan laporan analitik demografi audiens' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAudienceAnalytics", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/analytics/performance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan laporan performa konversi funnel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getPerformanceAnalytics", null);
__decorate([
    (0, common_1.Post)('organizer/events/:id/ad-spend'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_partners_affiliate'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat pengeluaran iklan marketing' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "recordAdSpend", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/growth-dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_analytics_growth'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data dashboard performa ROAS & afiliasi' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getGrowthDashboard", null);
__decorate([
    (0, common_1.Post)('track/page-view'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat traffic page view event' }),
    __param(0, (0, common_1.Body)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "trackPageView", null);
__decorate([
    (0, common_1.Post)('track/checkout-started'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat traffic checkout start event' }),
    __param(0, (0, common_1.Body)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "trackCheckoutStarted", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard & Analytics'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map