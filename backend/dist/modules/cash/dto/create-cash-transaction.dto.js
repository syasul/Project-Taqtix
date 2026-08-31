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
exports.CreateCashTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCashTransactionDto {
    type;
    amount;
    relatedOrderId;
    relatedPosTransactionId;
    note;
}
exports.CreateCashTransactionDto = CreateCashTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['ticket_sale', 'merchandise_sale', 'facility_sale', 'other'],
        description: 'Tipe transaksi kas masuk',
    }),
    (0, class_validator_1.IsEnum)(['ticket_sale', 'merchandise_sale', 'facility_sale', 'other']),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nominal kas (Rupiah)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCashTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID order terkait jika ada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "relatedOrderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID transaksi POS terkait jika ada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "relatedPosTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Catatan tambahan' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashTransactionDto.prototype, "note", void 0);
//# sourceMappingURL=create-cash-transaction.dto.js.map