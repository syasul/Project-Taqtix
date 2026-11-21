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
exports.ReleaseSeatsDto = exports.LockSeatsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class LockSeatsDto {
    seatIds;
    orderId;
}
exports.LockSeatsDto = LockSeatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['seat-id-1', 'seat-id-2'],
        description: 'Daftar ID kursi yang ingin dikunci untuk checkout',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Daftar kursi tidak boleh kosong' }),
    __metadata("design:type", Array)
], LockSeatsDto.prototype, "seatIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'order-uuid-1234',
        required: false,
        description: 'ID pemesanan yang mengunci kursi ini (jika ada)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LockSeatsDto.prototype, "orderId", void 0);
class ReleaseSeatsDto {
    seatIds;
    orderId;
}
exports.ReleaseSeatsDto = ReleaseSeatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['seat-id-1', 'seat-id-2'],
        description: 'Daftar ID kursi yang ingin dilepaskan kunciannya',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Daftar kursi tidak boleh kosong' }),
    __metadata("design:type", Array)
], ReleaseSeatsDto.prototype, "seatIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'order-uuid-1234',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReleaseSeatsDto.prototype, "orderId", void 0);
//# sourceMappingURL=lock-seats.dto.js.map