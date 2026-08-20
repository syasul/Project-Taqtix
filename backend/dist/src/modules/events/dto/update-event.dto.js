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
exports.UpdateEventDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateEventDto {
    title;
    description;
    location;
    startDate;
    endDate;
    bannerUrl;
}
exports.UpdateEventDto = UpdateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Taqwa Movement Concert 2026', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Event dakwah islam modern', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Jakarta Convention Center, Senayan',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-12T13:00:00Z', required: false }),
    (0, class_validator_1.IsDateString)({}, { message: 'Tanggal mulai tidak valid' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-12T22:00:00Z', required: false }),
    (0, class_validator_1.IsDateString)({}, { message: 'Tanggal selesai tidak valid' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://images.taqtix.id/banners/event1.jpg',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "bannerUrl", void 0);
//# sourceMappingURL=update-event.dto.js.map