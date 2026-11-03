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
exports.CreateBannerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBannerDto {
    title;
    subtitle;
    imageUrl;
    targetUrl;
    position;
    order;
    isActive;
}
exports.CreateBannerDto = CreateBannerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Judul atau headline banner promosi', example: 'Jakarta Live Fest 2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Subjudul atau tagline banner', example: 'Simfoni Musik Akbar Indonesia' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "subtitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL Gambar Banner', example: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL tujuan saat banner diklik', example: '/event/jakarta-live-fest-2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "targetUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Posisi penempatan banner', example: 'home_hero', default: 'home_hero' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Urutan tampilan slider banner', example: 1, default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBannerDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status keaktifan banner', example: true, default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateBannerDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-banner.dto.js.map