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
exports.CreateTicketCategoryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTicketCategoryDto {
    name;
    price;
    quota;
    saleStart;
    saleEnd;
}
exports.CreateTicketCategoryDto = CreateTicketCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VIP Pass' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama kategori tiket tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateTicketCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'Harga tidak boleh kurang dari 0' }),
    __metadata("design:type", Number)
], CreateTicketCategoryDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Kuota minimal harus 1' }),
    __metadata("design:type", Number)
], CreateTicketCategoryDto.prototype, "quota", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-01T00:00:00Z' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Tanggal mulai penjualan tidak valid' }),
    __metadata("design:type", String)
], CreateTicketCategoryDto.prototype, "saleStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-10T23:59:59Z' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Tanggal akhir penjualan tidak valid' }),
    __metadata("design:type", String)
], CreateTicketCategoryDto.prototype, "saleEnd", void 0);
//# sourceMappingURL=create-ticket-category.dto.js.map