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
const throttler_1 = require("@nestjs/throttler");
const admin_service_1 = require("./admin.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const create_organizer_dto_1 = require("./dto/create-organizer.dto");
const update_organizer_dto_1 = require("./dto/update-organizer.dto");
const create_partner_dto_1 = require("./dto/create-partner.dto");
const update_partner_dto_1 = require("./dto/update-partner.dto");
const create_lead_dto_1 = require("./dto/create-lead.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getOrganizers() {
        const result = await this.adminService.getOrganizers();
        return { success: true, data: result };
    }
    async createOrganizer(dto) {
        const result = await this.adminService.createOrganizer(dto);
        return { success: true, data: result };
    }
    async deleteOrganizer(id) {
        const result = await this.adminService.deleteOrganizer(id);
        return { success: true, data: result };
    }
    async updateOrganizer(id, dto) {
        const result = await this.adminService.updateOrganizerSegmentAndPlan(id, dto);
        return { success: true, data: result };
    }
    async getPartners() {
        const result = await this.adminService.getPartnersOversight();
        return { success: true, data: result };
    }
    async createPartner(dto) {
        const result = await this.adminService.createPartner(dto);
        return { success: true, data: result };
    }
    async updatePartner(id, dto) {
        const result = await this.adminService.updatePartner(id, dto);
        return { success: true, data: result };
    }
    async deletePartner(id) {
        const result = await this.adminService.deletePartner(id);
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
    async getEvents() {
        const result = await this.adminService.getEvents();
        return { success: true, data: result };
    }
    async approveEvent(id) {
        const result = await this.adminService.approveEvent(id);
        return { success: true, data: result };
    }
    async rejectEvent(id, reason) {
        const result = await this.adminService.rejectEvent(id, reason);
        return { success: true, data: result };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('admin/organizers'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar semua organizer (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrganizers", null);
__decorate([
    (0, common_1.Post)('admin/organizers'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat akun organizer / EO baru (Admin Only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organizer_dto_1.CreateOrganizerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createOrganizer", null);
__decorate([
    (0, common_1.Delete)('admin/organizers/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus akun organizer (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteOrganizer", null);
__decorate([
    (0, common_1.Patch)('admin/organizers/:id/segment'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah segmen dan plan organizer (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organizer_dto_1.UpdateOrganizerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateOrganizer", null);
__decorate([
    (0, common_1.Get)('admin/partners'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data audit/rekap partner afiliasi (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPartners", null);
__decorate([
    (0, common_1.Post)('admin/partners'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat partner afiliasi baru (Admin Only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_partner_dto_1.CreatePartnerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPartner", null);
__decorate([
    (0, common_1.Patch)('admin/partners/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Memperbarui data partner afiliasi (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_partner_dto_1.UpdatePartnerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePartner", null);
__decorate([
    (0, common_1.Delete)('admin/partners/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus partner afiliasi (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePartner", null);
__decorate([
    (0, common_1.Post)('leads'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Mengirimkan lead baru dari landing page (Public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
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
    (0, common_1.Get)('admin/events'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan seluruh event untuk moderasi (Admin Only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('admin/events/:id/approve'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menyetujui event untuk dipublikasikan (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveEvent", null);
__decorate([
    (0, common_1.Post)('admin/events/:id/reject'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menolak penerbitan event (Admin Only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectEvent", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Panel Console'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map