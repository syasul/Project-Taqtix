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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async updateOrganizer(id, dto) {
        const result = await this.adminService.updateOrganizerSegmentAndPlan(id, dto);
        return { success: true, data: result };
    }
    async createLead(dto) {
        const result = await this.adminService.createLead(dto);
        return { success: true, data: result };
    }
    async getLeads() {
        const result = await this.adminService.getLeads();
        return { success: true, data: result };
    }
    async updateLeadStatus(id, status) {
        const result = await this.adminService.updateLeadStatus(id, status);
        return { success: true, data: result };
    }
    async assignLead(id, adminId) {
        const result = await this.adminService.assignLead(id, adminId);
        return { success: true, data: result };
    }
    async getBilling() {
        const result = await this.adminService.getBillingOversight();
        return { success: true, data: result };
    }
    async getPartners() {
        const result = await this.adminService.getPartnersOversight();
        return { success: true, data: result };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Patch)('admin/organizers/:id/segment'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah segmen dan plan organizer (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateOrganizer", null);
__decorate([
    (0, common_1.Post)('leads'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengirimkan lead baru dari landing page (Public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)('admin/leads'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar leads masuk (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Patch)('admin/leads/:id/status'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah status lead pipeline (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateLeadStatus", null);
__decorate([
    (0, common_1.Patch)('admin/leads/:id/assign'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menugaskan admin ke lead (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('adminId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignLead", null);
__decorate([
    (0, common_1.Get)('admin/billing'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan rekap billing subscription (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBilling", null);
__decorate([
    (0, common_1.Get)('admin/partners'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data audit/rekap partner afiliasi (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPartners", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Panel Console'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map