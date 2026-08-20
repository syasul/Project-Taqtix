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
exports.SyncBatchDto = exports.ScanLogItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ScanLogItemDto {
    qrPayload;
    scannedAt;
}
exports.ScanLogItemDto = ScanLogItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Payload signed QR token',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'QR payload tidak boleh kosong' }),
    __metadata("design:type", String)
], ScanLogItemDto.prototype, "qrPayload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-08-20T03:10:00Z',
        description: 'Waktu pemindaian offline',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'Format tanggal pemindaian tidak valid' }),
    __metadata("design:type", String)
], ScanLogItemDto.prototype, "scannedAt", void 0);
class SyncBatchDto {
    logs;
}
exports.SyncBatchDto = SyncBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [ScanLogItemDto],
        description: 'Daftar logs scan offline yang akan disinkronkan',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScanLogItemDto),
    __metadata("design:type", Array)
], SyncBatchDto.prototype, "logs", void 0);
//# sourceMappingURL=sync-batch.dto.js.map