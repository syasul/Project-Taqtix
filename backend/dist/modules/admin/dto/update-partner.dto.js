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
exports.UpdatePartnerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdatePartnerDto {
    name;
    eventId;
    type;
    uniqueCode;
    promoCode;
    commissionType;
    commissionValue;
    email;
}
exports.UpdatePartnerDto = UpdatePartnerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Raffi Ahmad Official', description: 'Nama partner afiliasi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'event-uuid-5678', description: 'ID Event yang dipromosikan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'INFLUENCER',
        enum: ['AMBASSADOR', 'COMMUNITY', 'INFLUENCER', 'CORPORATE'],
        description: 'Tipe kategori partner',
    }),
    (0, class_validator_1.IsIn)(['AMBASSADOR', 'COMMUNITY', 'INFLUENCER', 'CORPORATE'], {
        message: 'Tipe partner harus salah satu dari: AMBASSADOR, COMMUNITY, INFLUENCER, CORPORATE',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'RAFFI2026', description: 'Kode unik referral' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "uniqueCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'DISKONRAF', description: 'Kode voucher diskon' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "promoCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'fixed', description: 'Tipe komisi (percentage / fixed)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "commissionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 25000, description: 'Besaran komisi' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Nilai komisi harus berupa angka' }),
    (0, class_validator_1.Min)(0, { message: 'Komisi tidak boleh bernilai negatif' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePartnerDto.prototype, "commissionValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'raffi.new@partner.com', description: 'Email partner' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "email", void 0);
//# sourceMappingURL=update-partner.dto.js.map