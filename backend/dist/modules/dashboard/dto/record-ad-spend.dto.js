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
exports.RecordAdSpendDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RecordAdSpendDto {
    channel;
    amount;
    periodStart;
    periodEnd;
}
exports.RecordAdSpendDto = RecordAdSpendDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Meta Ads (Instagram & Facebook)', description: 'Kanal periklanan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kanal iklan tidak boleh kosong' }),
    __metadata("design:type", String)
], RecordAdSpendDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500000, description: 'Biaya pengeluaran iklan (Rp)' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Biaya iklan harus berupa angka' }),
    (0, class_validator_1.Min)(0, { message: 'Biaya iklan tidak boleh negatif' }),
    __metadata("design:type", Number)
], RecordAdSpendDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-01T00:00:00Z', description: 'Tanggal mulai periode iklan' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Format periodStart tidak valid' }),
    __metadata("design:type", String)
], RecordAdSpendDto.prototype, "periodStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-07T23:59:59Z', description: 'Tanggal akhir periode iklan' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Format periodEnd tidak valid' }),
    __metadata("design:type", String)
], RecordAdSpendDto.prototype, "periodEnd", void 0);
//# sourceMappingURL=record-ad-spend.dto.js.map