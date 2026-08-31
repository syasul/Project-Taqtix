"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLineupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_lineup_dto_1 = require("./create-lineup.dto");
class UpdateLineupDto extends (0, swagger_1.PartialType)(create_lineup_dto_1.CreateLineupDto) {
}
exports.UpdateLineupDto = UpdateLineupDto;
//# sourceMappingURL=update-lineup.dto.js.map