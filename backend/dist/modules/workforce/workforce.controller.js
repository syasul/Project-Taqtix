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
exports.WorkforceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workforce_service_1 = require("./workforce.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let WorkforceController = class WorkforceController {
    workforceService;
    constructor(workforceService) {
        this.workforceService = workforceService;
    }
    async create(eventId, dto, addedByUserId) {
        const result = await this.workforceService.create(eventId, dto, addedByUserId);
        return { success: true, data: result };
    }
    async findAll(eventId, division, status) {
        const result = await this.workforceService.findAll(eventId, division, status);
        return { success: true, data: result };
    }
    async getPicDashboard(eventId, userId, divisionFilter) {
        const result = await this.workforceService.getPicDashboard(eventId, userId, divisionFilter);
        return { success: true, data: result };
    }
    async getCrewLink(memberId) {
        const link = await this.workforceService.generateCrewLink(memberId);
        return { success: true, data: { link } };
    }
    async getCrewMe(token) {
        const result = await this.workforceService.getCrewMe(token);
        return { success: true, data: result };
    }
    async selfCheckIn(token, latitude, longitude) {
        const result = await this.workforceService.selfCheckIn(token, latitude, longitude);
        return { success: true, data: result };
    }
    async scanCrew(qrPayload) {
        const result = await this.workforceService.scanCrew(qrPayload);
        return { success: true, data: result };
    }
};
exports.WorkforceController = WorkforceController;
__decorate([
    (0, common_1.Post)('organizer/events/:eventId/workforce'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_workforce_crew'),
    (0, swagger_1.ApiOperation)({ summary: 'Menambahkan crew baru untuk event' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('organizer/events/:eventId/workforce'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar semua crew untuk event' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Query)('division')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('organizer/events/:eventId/workforce/pic-dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan dashboard PIC status divisi' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Query)('division')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "getPicDashboard", null);
__decorate([
    (0, common_1.Get)('organizer/workforce/:memberId/link'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_workforce_crew'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan link self check-in untuk crew' }),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "getCrewLink", null);
__decorate([
    (0, common_1.Get)('crew/me'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data session crew berdasarkan token' }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "getCrewMe", null);
__decorate([
    (0, common_1.Post)('crew/self-check-in'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crew melakukan check-in mandiri via GPS' }),
    __param(0, (0, common_1.Body)('token')),
    __param(1, (0, common_1.Body)('latitude')),
    __param(2, (0, common_1.Body)('longitude')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "selfCheckIn", null);
__decorate([
    (0, common_1.Post)('gate/workforce-scan'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Gate staff melakukan scanning QR Code crew' }),
    __param(0, (0, common_1.Body)('qrPayload')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkforceController.prototype, "scanCrew", null);
exports.WorkforceController = WorkforceController = __decorate([
    (0, swagger_1.ApiTags)('Workforce Management'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [workforce_service_1.WorkforceService])
], WorkforceController);
//# sourceMappingURL=workforce.controller.js.map