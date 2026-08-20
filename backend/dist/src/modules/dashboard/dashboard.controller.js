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
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
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
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('organizer/events/:id/dashboard'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan rangkuman data penjualan & revenue event (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rangkuman metrik dashboard.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEventDashboard", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/buyers'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan database pembeli tiket event (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Database pembeli.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBuyers", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/buyers/export'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mengekspor data pembeli tiket ke file CSV (Organizer Only)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportBuyers", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/channel-performance'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan data atribusi performa marketing channel (Organizer Only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Statistik performa marketing channel.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getChannelPerformance", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map