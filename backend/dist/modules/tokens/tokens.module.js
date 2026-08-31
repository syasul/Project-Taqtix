"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensModule = void 0;
const common_1 = require("@nestjs/common");
const tokens_controller_1 = require("./tokens.controller");
const api_v1_controller_1 = require("./api-v1.controller");
const tokens_service_1 = require("./tokens.service");
const api_key_auth_guard_1 = require("../../common/guards/api-key-auth.guard");
const prisma_module_1 = require("../prisma/prisma.module");
let TokensModule = class TokensModule {
};
exports.TokensModule = TokensModule;
exports.TokensModule = TokensModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [tokens_controller_1.TokensController, api_v1_controller_1.ApiV1Controller],
        providers: [tokens_service_1.TokensService, api_key_auth_guard_1.ApiKeyAuthGuard],
        exports: [tokens_service_1.TokensService, api_key_auth_guard_1.ApiKeyAuthGuard],
    })
], TokensModule);
//# sourceMappingURL=tokens.module.js.map