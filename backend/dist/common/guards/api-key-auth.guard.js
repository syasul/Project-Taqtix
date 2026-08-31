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
exports.ApiKeyAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const tokens_service_1 = require("../../modules/tokens/tokens.service");
let ApiKeyAuthGuard = class ApiKeyAuthGuard {
    tokensService;
    constructor(tokensService) {
        this.tokensService = tokensService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'] || request.headers['X-API-Key'];
        if (!apiKey) {
            throw new common_1.UnauthorizedException('Header X-API-Key wajib disertakan');
        }
        const tokenRecord = await this.tokensService.validateApiKey(apiKey);
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('API Key tidak valid atau telah dicabut');
        }
        request.apiToken = tokenRecord;
        request.organizer = tokenRecord.organizer;
        return true;
    }
};
exports.ApiKeyAuthGuard = ApiKeyAuthGuard;
exports.ApiKeyAuthGuard = ApiKeyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tokens_service_1.TokensService])
], ApiKeyAuthGuard);
//# sourceMappingURL=api-key-auth.guard.js.map