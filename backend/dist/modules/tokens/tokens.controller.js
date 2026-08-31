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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tokens_service_1 = require("./tokens.service");
const create_api_token_dto_1 = require("./dto/create-api-token.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let TokensController = class TokensController {
    tokensService;
    constructor(tokensService) {
        this.tokensService = tokensService;
    }
    async generateToken(dto, userId) {
        return this.tokensService.generateToken(dto, userId);
    }
    async listTokens(userId) {
        return this.tokensService.listTokens(userId);
    }
    async revokeToken(id, userId) {
        return this.tokensService.revokeToken(id, userId);
    }
};
exports.TokensController = TokensController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate token API baru (Secret token hanya ditampilkan satu kali)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Token berhasil di-generate.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_api_token_dto_1.CreateApiTokenDto, String]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "generateToken", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar token API milik organizer' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Daftar API token berhasil diambil.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "listTokens", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mencabut / me-revoke token API' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Token berhasil dicabut.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "revokeToken", null);
exports.TokensController = TokensController = __decorate([
    (0, swagger_1.ApiTags)('Token Generator (API Access)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('organizer', 'organizer_member'),
    (0, common_1.Controller)('organizer/api-tokens'),
    __metadata("design:paramtypes", [tokens_service_1.TokensService])
], TokensController);
//# sourceMappingURL=tokens.controller.js.map