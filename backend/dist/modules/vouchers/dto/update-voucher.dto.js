"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVoucherDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_voucher_dto_1 = require("./create-voucher.dto");
class UpdateVoucherDto extends (0, swagger_1.PartialType)(create_voucher_dto_1.CreateVoucherDto) {
}
exports.UpdateVoucherDto = UpdateVoucherDto;
//# sourceMappingURL=update-voucher.dto.js.map