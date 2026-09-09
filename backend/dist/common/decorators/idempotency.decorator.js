"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireIdempotency = exports.REQUIRE_IDEMPOTENCY_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_IDEMPOTENCY_KEY = 'REQUIRE_IDEMPOTENCY';
const RequireIdempotency = () => (0, common_1.SetMetadata)(exports.REQUIRE_IDEMPOTENCY_KEY, true);
exports.RequireIdempotency = RequireIdempotency;
//# sourceMappingURL=idempotency.decorator.js.map