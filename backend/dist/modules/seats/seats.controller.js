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
exports.SeatsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seats_service_1 = require("./seats.service");
const generate_seats_dto_1 = require("./dto/generate-seats.dto");
const lock_seats_dto_1 = require("./dto/lock-seats.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let SeatsController = class SeatsController {
    seatsService;
    constructor(seatsService) {
        this.seatsService = seatsService;
    }
    async getPublicSeating(slugOrId) {
        const data = await this.seatsService.getPublicEventSeating(slugOrId);
        return { success: true, data };
    }
    async lockSeats(slugOrId, dto) {
        const result = await this.seatsService.lockSeats(slugOrId, dto.seatIds, dto.orderId);
        return { success: true, data: result };
    }
    async releaseSeats(dto) {
        const result = await this.seatsService.releaseSeats(dto.seatIds, dto.orderId);
        return { success: true, data: result };
    }
    async getOrganizerSeating(eventId, userId) {
        const data = await this.seatsService.getOrganizerSeating(eventId, userId);
        return { success: true, data };
    }
    async generateSeats(eventId, userId, dto) {
        const data = await this.seatsService.generateSectionSeats(eventId, userId, dto);
        return { success: true, data };
    }
    async toggleSeat(eventId, seatId, userId) {
        const data = await this.seatsService.toggleSeatStatus(eventId, seatId, userId);
        return { success: true, data };
    }
    async deleteSection(eventId, sectionId, userId) {
        const data = await this.seatsService.deleteSection(eventId, sectionId, userId);
        return { success: true, data };
    }
};
exports.SeatsController = SeatsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('events/:slugOrId/seating'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan denah dan status kursi publik (Public)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Data denah dan kursi berhasil diambil.',
    }),
    __param(0, (0, common_1.Param)('slugOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "getPublicSeating", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('events/:slugOrId/seating/lock'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mengunci kursi sementara selama 10 menit saat checkout (Public)',
    }),
    __param(0, (0, common_1.Param)('slugOrId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lock_seats_dto_1.LockSeatsDto]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "lockSeats", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('events/:slugOrId/seating/release'),
    (0, swagger_1.ApiOperation)({
        summary: 'Melepas kuncian kursi sementara (Public)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lock_seats_dto_1.ReleaseSeatsDto]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "releaseSeats", null);
__decorate([
    (0, common_1.Get)('organizer/events/:id/seating'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan konfigurasi seksi dan kursi event (Organizer)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "getOrganizerSeating", null);
__decorate([
    (0, common_1.Post)('organizer/events/:id/seating/generate'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat grid kursi otomatis untuk seksi denah (Organizer)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, generate_seats_dto_1.GenerateSeatsDto]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "generateSeats", null);
__decorate([
    (0, common_1.Patch)('organizer/events/:id/seating/seats/:seatId/toggle'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Toggle kursi aktif/dinonaktifkan (ruang kosong/tiang) (Organizer)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('seatId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "toggleSeat", null);
__decorate([
    (0, common_1.Delete)('organizer/events/:id/seating/sections/:sectionId'),
    (0, roles_decorator_1.Roles)('organizer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Menghapus seksi denah dan semua kursinya (Organizer)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('sectionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SeatsController.prototype, "deleteSection", null);
exports.SeatsController = SeatsController = __decorate([
    (0, swagger_1.ApiTags)('Seating Layout & Kursi'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [seats_service_1.SeatsService])
], SeatsController);
//# sourceMappingURL=seats.controller.js.map