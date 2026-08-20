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
exports.CreateAffiliateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateAffiliateDto {
    name;
    type;
    commissionPct;
    promoCode;
}
exports.CreateAffiliateDto = CreateAffiliateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Sponsor Utama',
        description: 'Nama partner afiliasi',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama partner tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateAffiliateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.PartnerType,
        example: client_1.PartnerType.INFLUENCER,
        description: 'Tipe partner',
    }),
    (0, class_validator_1.IsEnum)(client_1.PartnerType, { message: 'Tipe partner tidak valid' }),
    __metadata("design:type", String)
], CreateAffiliateDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 10,
        required: false,
        description: 'Persentase komisi partner',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAffiliateDto.prototype, "commissionPct", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'SPONSOR10',
        required: false,
        description: 'Kode promo yang diasosiasikan',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAffiliateDto.prototype, "promoCode", void 0);
//# sourceMappingURL=create-affiliate.dto.js.map