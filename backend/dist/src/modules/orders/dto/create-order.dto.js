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
exports.CreateOrderDto = exports.OrderItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class OrderItemDto {
    ticketTypeId;
    qty;
}
exports.OrderItemDto = OrderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ticket-type-uuid-here', description: 'ID kategori tiket' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Ticket Type ID tidak boleh kosong' }),
    __metadata("design:type", String)
], OrderItemDto.prototype, "ticketTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Jumlah kuantitas tiket yang dipesan' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Kuantitas minimal harus 1' }),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "qty", void 0);
class CreateOrderDto {
    eventId;
    items;
    promoCode;
    affiliateCode;
    buyerEmail;
    buyerName;
    buyerPhone;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'event-uuid-here', description: 'ID event terkait' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event ID tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OrderItemDto], description: 'Daftar tiket yang dibeli' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MERDEKA80', required: false, description: 'Kode promo jika ada' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "promoCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PARTNERCODE', required: false, description: 'Kode unik afiliasi jika ada' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "affiliateCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'buyer@example.com', description: 'Alamat email pembeli' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Alamat email tidak valid' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "buyerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Budi Santoso', description: 'Nama lengkap pembeli' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama pembeli tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "buyerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '081234567890', required: false, description: 'Nomor HP/WhatsApp pembeli' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "buyerPhone", void 0);
//# sourceMappingURL=create-order.dto.js.map