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
exports.CreateLeadDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateLeadDto {
    name;
    organizationName;
    email;
    phone;
    message;
}
exports.CreateLeadDto = CreateLeadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Syamsul Ma’arif', description: 'Nama calon klien / organizer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama tidak boleh kosong' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Nama maksimal 100 karakter' }),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PT Kreasi Festival Nusantara', description: 'Nama organisasi / perusahaan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama organisasi tidak boleh kosong' }),
    (0, class_validator_1.MaxLength)(150, { message: 'Nama organisasi maksimal 150 karakter' }),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "organizationName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'syamsul@kreasifestival.id', description: 'Email narahubung' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid' }),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '081234567890', description: 'Nomor telepon / WhatsApp' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor telepon tidak boleh kosong' }),
    (0, class_validator_1.MaxLength)(30, { message: 'Nomor telepon maksimal 30 karakter' }),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Kami ingin konsultasi tiket konser musik kapasitas 5000 orang.', description: 'Pesan kebutuhan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pesan tidak boleh kosong' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'Pesan maksimal 2000 karakter' }),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "message", void 0);
//# sourceMappingURL=create-lead.dto.js.map