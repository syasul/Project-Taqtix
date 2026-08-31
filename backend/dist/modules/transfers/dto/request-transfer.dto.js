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
exports.RequestTransferDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RequestTransferDto {
    toName;
    toEmail;
    toPhone;
}
exports.RequestTransferDto = RequestTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Budi Santoso', description: 'Nama lengkap penerima tiket' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestTransferDto.prototype, "toName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'budi@example.com', description: 'Email penerima tiket' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid' }),
    __metadata("design:type", String)
], RequestTransferDto.prototype, "toEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '081298765432', description: 'Nomor WhatsApp penerima tiket' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestTransferDto.prototype, "toPhone", void 0);
//# sourceMappingURL=request-transfer.dto.js.map