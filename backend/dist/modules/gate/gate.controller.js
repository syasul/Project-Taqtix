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
exports.GateController = exports.CreateGateStaffGlobalDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gate_service_1 = require("./gate.service");
const assign_gate_staff_dto_1 = require("./dto/assign-gate-staff.dto");
const validate_ticket_dto_1 = require("./dto/validate-ticket.dto");
const manual_checkin_dto_1 = require("./dto/manual-checkin.dto");
const sync_batch_dto_1 = require("./dto/sync-batch.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const class_validator_1 = require("class-validator");
class CreateGateStaffGlobalDto extends assign_gate_staff_dto_1.AssignGateStaffDto {
    eventId;
}
exports.CreateGateStaffGlobalDto = CreateGateStaffGlobalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'event-uuid-here', description: 'ID event' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGateStaffGlobalDto.prototype, "eventId", void 0);
let GateController = class GateController {
    gateService;
    constructor(gateService) {
        this.gateService = gateService;
    }
    async getAssignedEvents(staffUserId) {
        return this.gateService.getAssignedEvents(staffUserId);
    }
    async validateTicket(dto, staffUserId) {
        return this.gateService.validateTicket(dto, staffUserId);
    }
    async manualCheckin(dto, staffUserId) {
        return this.gateService.manualCheckin(dto, staffUserId);
    }
    async syncBatch(dto, staffUserId) {
        return this.gateService.syncBatch(dto, staffUserId);
    }
    async getAttendance(eventId, userId) {
        return this.gateService.getAttendance(eventId, userId);
    }
    async getManifest(eventId, staffUserId) {
        return this.gateService.getManifest(eventId, staffUserId);
    }
    async assignStaff(eventId, dto, userId) {
        return this.gateService.assignStaff(eventId, dto, userId);
    }
    async getStaffList(eventId, userId) {
        return this.gateService.getStaffList(eventId, userId);
    }
    async assignStaffGlobal(dto, userId) {
        return this.gateService.assignStaff(dto.eventId, { email: dto.email }, userId);
    }
};
exports.GateController = GateController;
__decorate([
    (0, common_1.Get)('gate/events'),
    (0, roles_decorator_1.Roles)('gate_staff', 'organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan daftar event yang ditugaskan ke staff gerbang',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "getAssignedEvents", null);
__decorate([
    (0, common_1.Post)('gate/scan'),
    (0, roles_decorator_1.Roles)('gate_staff', 'organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Validasi QR tiket elektronik untuk check-in masuk (Staff/Organizer)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Check-in sukses atau tiket ditolak.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_ticket_dto_1.ValidateTicketDto, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "validateTicket", null);
__decorate([
    (0, common_1.Post)('gate/manual-checkin'),
    (0, roles_decorator_1.Roles)('gate_staff', 'organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Fallback check-in menggunakan input kode tiket manual',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Check-in manual sukses.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manual_checkin_dto_1.ManualCheckinDto, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "manualCheckin", null);
__decorate([
    (0, common_1.Post)('gate/scan/batch'),
    (0, roles_decorator_1.Roles)('gate_staff', 'organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sinkronisasi offline scan logs secara massal' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Sinkronisasi sukses.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_batch_dto_1.SyncBatchDto, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "syncBatch", null);
__decorate([
    (0, common_1.Get)('gate/events/:eventId/live-count'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan data statistik kehadiran real-time' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Statistik kehadiran.' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Get)('gate/events/:eventId/manifest'),
    (0, roles_decorator_1.Roles)('gate_staff', 'organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan data manifest tiket untuk sinkronisasi offline (Staff/Organizer)',
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Manifest data tiket.' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "getManifest", null);
__decorate([
    (0, common_1.Post)('events/:id/gate-staff'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendaftarkan staff gerbang ke event tertentu' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Staf gerbang berhasil didaftarkan.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_gate_staff_dto_1.AssignGateStaffDto, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "assignStaff", null);
__decorate([
    (0, common_1.Get)('events/:id/gate-staff'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar staff gerbang event tertentu' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar staf gerbang.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "getStaffList", null);
__decorate([
    (0, common_1.Post)('gate-staff'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendaftarkan staff gerbang (Global path fallback)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Staf gerbang berhasil didaftarkan.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateGateStaffGlobalDto, String]),
    __metadata("design:returntype", Promise)
], GateController.prototype, "assignStaffGlobal", null);
exports.GateController = GateController = __decorate([
    (0, swagger_1.ApiTags)('Gate & Scanner'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [gate_service_1.GateService])
], GateController);
//# sourceMappingURL=gate.controller.js.map