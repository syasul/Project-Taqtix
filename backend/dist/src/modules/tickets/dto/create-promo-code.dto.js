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
exports.CreatePromoCodeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePromoCodeDto {
    code;
    discount;
    maxUsage;
}
exports.CreatePromoCodeDto = CreatePromoCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MERDEKA80', description: 'Kode promo unik' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kode promo tidak boleh kosong' }),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 25000,
        description: 'Nilai diskon (bisa nominal atau persentase)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Diskon harus lebih besar dari 0' }),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 100,
        description: 'Batas maksimum penggunaan kode promo',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Maksimum penggunaan minimal 1' }),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "maxUsage", void 0);
//# sourceMappingURL=create-promo-code.dto.js.map