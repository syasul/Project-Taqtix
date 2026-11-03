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
exports.CreateRundownDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateRundownDto {
    timeRange;
    title;
    description;
    isHighlight;
    order;
}
exports.CreateRundownDto = CreateRundownDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Waktu atau rentang jam sesi (misal: 08:00 - 09:00 atau 09:30 WIB)',
        example: '08:00 - 09:00',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Waktu sesi wajib diisi' }),
    __metadata("design:type", String)
], CreateRundownDto.prototype, "timeRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Judul atau nama sesi acara',
        example: 'Open Gate & Registrasi Kehadiran',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Judul agenda wajib diisi' }),
    __metadata("design:type", String)
], CreateRundownDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Deskripsi lengkap atau poin agenda kegiatan',
        example: 'Pemeriksaan barang bawaan dan pemindaian barcode e-ticket di pintu masuk venue oleh panitia.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRundownDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tandai sebagai sesi utama / highlight dengan aksen visual khusus',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRundownDto.prototype, "isHighlight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Urutan tampilan agenda',
        example: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRundownDto.prototype, "order", void 0);
//# sourceMappingURL=create-rundown.dto.js.map