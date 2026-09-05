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
exports.CreateBroadcastDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateBroadcastDto {
    message;
    channel;
    subject;
}
exports.CreateBroadcastDto = CreateBroadcastDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Halo! Dapatkan potongan 20% khusus untuk Anda...', description: 'Pesan broadcast' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pesan broadcast tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateBroadcastDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'whatsapp', enum: ['whatsapp', 'email'], description: 'Kanal pengiriman' }),
    (0, class_validator_1.IsIn)(['whatsapp', 'email'], { message: 'Kanal harus berupa whatsapp atau email' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBroadcastDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Penawaran Eksklusif Tiket TAQtix', description: 'Subjek email jika kanal email' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBroadcastDto.prototype, "subject", void 0);
//# sourceMappingURL=create-broadcast.dto.js.map