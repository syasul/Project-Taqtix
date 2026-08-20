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
exports.ValidatePromoCodeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ValidatePromoCodeDto {
    code;
    eventId;
}
exports.ValidatePromoCodeDto = ValidatePromoCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MERDEKA80', description: 'Kode promo yang diinput pembeli' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kode promo tidak boleh kosong' }),
    __metadata("design:type", String)
], ValidatePromoCodeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'event-uuid-here', description: 'ID event terkait' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Event ID tidak boleh kosong' }),
    __metadata("design:type", String)
], ValidatePromoCodeDto.prototype, "eventId", void 0);
//# sourceMappingURL=validate-promo-code.dto.js.map