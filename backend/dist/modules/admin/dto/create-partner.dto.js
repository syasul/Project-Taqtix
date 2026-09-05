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
exports.CreatePartnerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePartnerDto {
    name;
    eventId;
    type;
    uniqueCode;
    promoCode;
    commissionType;
    commissionValue;
    email;
    password;
}
exports.CreatePartnerDto = CreatePartnerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Raffi Ahmad Ambassador', description: 'Nama partner afiliasi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama partner tidak boleh kosong' }),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'event-uuid-1234', description: 'ID Event yang dipromosikan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event ID tidak boleh kosong' }),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "eventId", void 0);
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
], CreatePartnerDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'RAF50', description: 'Kode unik referral' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kode unik referral tidak boleh kosong' }),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "uniqueCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PROMORAF', description: 'Kode voucher diskon' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "promoCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'percentage', description: 'Tipe komisi (percentage / fixed)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "commissionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Besaran komisi' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Nilai komisi harus berupa angka' }),
    (0, class_validator_1.Min)(0, { message: 'Komisi tidak boleh bernilai negatif' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePartnerDto.prototype, "commissionValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'raffi@partner.com', description: 'Email partner' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PartnerSecret123', description: 'Password akun portal partner' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password minimal 6 karakter' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "password", void 0);
//# sourceMappingURL=create-partner.dto.js.map