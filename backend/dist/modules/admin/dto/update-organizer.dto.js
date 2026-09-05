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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrganizerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateOrganizerDto {
    name;
    segment;
    plan;
    planExpiresAt;
    bankAccount;
}
exports.UpdateOrganizerDto = UpdateOrganizerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nusantara Creative EO Baru', description: 'Nama penyelenggara' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrganizerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ENTERPRISE', description: 'Segmentasi bisnis organizer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrganizerDto.prototype, "segment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ENTERPRISE_CUSTOM', description: 'Paket langganan/plan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrganizerDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2027-12-31T23:59:59Z', description: 'Tanggal kedaluwarsa plan' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Format tanggal planExpiresAt tidak valid' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrganizerDto.prototype, "planExpiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Mandiri - 987654321 a.n PT Nusantara', description: 'Rekening bank' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrganizerDto.prototype, "bankAccount", void 0);
//# sourceMappingURL=update-organizer.dto.js.map