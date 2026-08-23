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
exports.CRMController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crm_service_1 = require("./crm.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let CRMController = class CRMController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    async createSegment(eventId, name, criteria) {
        const result = await this.crmService.createSegment(eventId, name, criteria);
        return { success: true, data: result };
    }
    async findSegments(eventId) {
        const result = await this.crmService.findSegments(eventId);
        return { success: true, data: result };
    }
    async getSegmentMembers(segmentId) {
        const result = await this.crmService.getSegmentMembers(segmentId);
        return { success: true, data: result };
    }
    async createBroadcast(segmentId, message) {
        const result = await this.crmService.createBroadcast(segmentId, message);
        return { success: true, data: result };
    }
    async getBroadcastStatus(jobId) {
        const result = await this.crmService.getBroadcastStatus(jobId);
        return result;
    }
};
exports.CRMController = CRMController;
__decorate([
    (0, common_1.Post)('organizer/events/:eventId/segments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_audience_segments'),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat segmen pembeli baru' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('criteria')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CRMController.prototype, "createSegment", null);
__decorate([
    (0, common_1.Get)('organizer/events/:eventId/segments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar semua segmen event' }),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CRMController.prototype, "findSegments", null);
__decorate([
    (0, common_1.Get)('organizer/segments/:segmentId/members'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_audience_segments'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar anggota pembeli yang match kriteria segmen' }),
    __param(0, (0, common_1.Param)('segmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CRMController.prototype, "getSegmentMembers", null);
__decorate([
    (0, common_1.Post)('organizer/segments/:segmentId/broadcast'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('manage_audience_segments'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengirim broadcast pesan ke segmen' }),
    __param(0, (0, common_1.Param)('segmentId')),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CRMController.prototype, "createBroadcast", null);
__decorate([
    (0, common_1.Get)('organizer/broadcasts/:jobId/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengecek status progres broadcast' }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CRMController.prototype, "getBroadcastStatus", null);
exports.CRMController = CRMController = __decorate([
    (0, swagger_1.ApiTags)('Audience CRM & Segments'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [crm_service_1.CRMService])
], CRMController);
//# sourceMappingURL=crm.controller.js.map