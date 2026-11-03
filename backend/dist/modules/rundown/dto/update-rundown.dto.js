"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRundownDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_rundown_dto_1 = require("./create-rundown.dto");
class UpdateRundownDto extends (0, swagger_1.PartialType)(create_rundown_dto_1.CreateRundownDto) {
}
exports.UpdateRundownDto = UpdateRundownDto;
//# sourceMappingURL=update-rundown.dto.js.map