"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkforceModule = void 0;
const common_1 = require("@nestjs/common");
const workforce_controller_1 = require("./workforce.controller");
const workforce_service_1 = require("./workforce.service");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const jwt_1 = require("@nestjs/jwt");
let WorkforceModule = class WorkforceModule {
};
exports.WorkforceModule = WorkforceModule;
exports.WorkforceModule = WorkforceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, jwt_1.JwtModule],
        controllers: [workforce_controller_1.WorkforceController],
        providers: [workforce_service_1.WorkforceService],
        exports: [workforce_service_1.WorkforceService],
    })
], WorkforceModule);
//# sourceMappingURL=workforce.module.js.map