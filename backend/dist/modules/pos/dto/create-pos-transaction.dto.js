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
exports.CreatePosTransactionDto = exports.PosItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PosItemDto {
    type;
    refId;
    name;
    qty;
    unitPrice;
}
exports.PosItemDto = PosItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ticket', 'facility'], description: 'Tipe item' }),
    (0, class_validator_1.IsEnum)(['ticket', 'facility']),
    __metadata("design:type", String)
], PosItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID kategori tiket atau ID fasilitas' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PosItemDto.prototype, "refId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nama item' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PosItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Jumlah item' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PosItemDto.prototype, "qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Harga satuan item' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PosItemDto.prototype, "unitPrice", void 0);
class CreatePosTransactionDto {
    items;
    paymentMethod;
    buyerName;
    buyerPhone;
}
exports.CreatePosTransactionDto = CreatePosTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosItemDto], description: 'Daftar item belanja di POS' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosItemDto),
    __metadata("design:type", Array)
], CreatePosTransactionDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['cash', 'qris', 'debit'],
        description: 'Metode pembayaran di POS kasir',
    }),
    (0, class_validator_1.IsEnum)(['cash', 'qris', 'debit']),
    __metadata("design:type", String)
], CreatePosTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nama pembeli (opsional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosTransactionDto.prototype, "buyerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nomor WhatsApp / HP pembeli (opsional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosTransactionDto.prototype, "buyerPhone", void 0);
//# sourceMappingURL=create-pos-transaction.dto.js.map