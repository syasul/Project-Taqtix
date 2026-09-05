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
exports.CreateWorkforceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateWorkforceDto {
    name;
    phone;
    division;
    role;
    picUserId;
}
exports.CreateWorkforceDto = CreateWorkforceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ahmad Fauzi', description: 'Nama crew / staff event' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama tidak boleh kosong' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Nama maksimal 100 karakter' }),
    __metadata("design:type", String)
], CreateWorkforceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08123456789', description: 'Nomor telepon / WhatsApp' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor telepon tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateWorkforceDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ticketing & Gate', description: 'Divisi kerja kru' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Divisi tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateWorkforceDto.prototype, "division", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Scanner Operator', description: 'Peran tugas kru' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Role/peran tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateWorkforceDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user-uuid-pic', description: 'ID User PIC supervisor (jika ada)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWorkforceDto.prototype, "picUserId", void 0);
//# sourceMappingURL=create-workforce.dto.js.map