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
exports.GenerateSeatsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GenerateSeatsDto {
    sectionName;
    ticketCategoryId;
    stagePosition;
    rowStart;
    rowEnd;
    seatsPerRow;
    aisleAfterSeats;
    disabledSeatNumbers;
}
exports.GenerateSeatsDto = GenerateSeatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'VIP Tengah',
        description: 'Nama seksi denah panggung',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama seksi tidak boleh kosong' }),
    __metadata("design:type", String)
], GenerateSeatsDto.prototype, "sectionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'cat-uuid-1234',
        required: false,
        description: 'ID Kategori/Tier tiket yang diasosiasikan dengan seksi ini',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateSeatsDto.prototype, "ticketCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'CENTER',
        default: 'CENTER',
        description: 'Posisi seksi terhadap panggung (TOP, BOTTOM, LEFT, RIGHT, CENTER)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateSeatsDto.prototype, "stagePosition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'A',
        description: 'Huruf atau angka baris awal (misal: "A" atau "1")',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Baris awal tidak boleh kosong' }),
    __metadata("design:type", String)
], GenerateSeatsDto.prototype, "rowStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'H',
        description: 'Huruf atau angka baris akhir (misal: "H" atau "8")',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Baris akhir tidak boleh kosong' }),
    __metadata("design:type", String)
], GenerateSeatsDto.prototype, "rowEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 16,
        description: 'Jumlah kursi dalam tiap baris',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Minimal 1 kursi per baris' }),
    (0, class_validator_1.Max)(50, { message: 'Maksimal 50 kursi per baris' }),
    __metadata("design:type", Number)
], GenerateSeatsDto.prototype, "seatsPerRow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [8],
        required: false,
        description: 'Nomor kolom kursi yang memiliki lorong/gang kosong setelahnya',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateSeatsDto.prototype, "aisleAfterSeats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['A-1', 'A-2'],
        required: false,
        description: 'Daftar nomor kursi yang dinonaktifkan (ruang kosong/tiang/sound)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateSeatsDto.prototype, "disabledSeatNumbers", void 0);
//# sourceMappingURL=generate-seats.dto.js.map