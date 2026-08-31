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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exports_service_1 = require("./exports.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let ExportsController = class ExportsController {
    exportsService;
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    async exportCrossEventSummary(from, to, format, userId, res) {
        const result = await this.exportsService.exportCrossEventSummary(userId, from, to);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.status(common_1.HttpStatus.OK).send(result.csv);
    }
    async exportOrders(eventId, format, userId, res) {
        const result = await this.exportsService.exportOrders(eventId, userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.status(common_1.HttpStatus.OK).send(result.csv);
    }
    async exportAttendance(eventId, format, userId, res) {
        const result = await this.exportsService.exportAttendance(eventId, userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.status(common_1.HttpStatus.OK).send(result.csv);
    }
    async exportFinancialSummary(eventId, format, userId, res) {
        const result = await this.exportsService.exportFinancialSummary(eventId, userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.status(common_1.HttpStatus.OK).send(result.csv);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)('export/cross-event-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Export ringkasan lintas event (org-level) dalam CSV' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'File CSV berhasil di-generate.' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportCrossEventSummary", null);
__decorate([
    (0, common_1.Get)('events/:id/export/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Export seluruh daftar pesanan event dalam CSV' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'File CSV berhasil di-generate.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportOrders", null);
__decorate([
    (0, common_1.Get)('events/:id/export/attendance'),
    (0, swagger_1.ApiOperation)({ summary: 'Export daftar kehadiran pengunjung event dalam CSV' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'File CSV berhasil di-generate.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportAttendance", null);
__decorate([
    (0, common_1.Get)('events/:id/export/financial-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Export ringkasan keuangan event dalam CSV' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'File CSV berhasil di-generate.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportFinancialSummary", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiTags)('Exports & Reports (Rekap Data)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer'),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map