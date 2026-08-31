"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomFieldDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_custom_field_dto_1 = require("./create-custom-field.dto");
class UpdateCustomFieldDto extends (0, swagger_1.PartialType)(create_custom_field_dto_1.CreateCustomFieldDto) {
}
exports.UpdateCustomFieldDto = UpdateCustomFieldDto;
//# sourceMappingURL=update-custom-field.dto.js.map