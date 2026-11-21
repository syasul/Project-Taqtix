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
exports.OrganizersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const organizers_service_1 = require("./organizers.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_post_dto_1 = require("./dto/create-post.dto");
const follow_organizer_dto_1 = require("./dto/follow-organizer.dto");
let OrganizersController = class OrganizersController {
    organizersService;
    constructor(organizersService) {
        this.organizersService = organizersService;
    }
    async getPublicOrganizer(slug) {
        const data = await this.organizersService.getPublicOrganizer(slug);
        return { success: true, data };
    }
    async toggleFollow(slug, dto) {
        const data = await this.organizersService.toggleFollow(slug, dto);
        return { success: true, ...data };
    }
    async checkFollowing(slug, email) {
        const data = await this.organizersService.checkFollowing(slug, email);
        return { success: true, ...data };
    }
    async getPublicPosts(slug, page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.organizersService.getPublicPosts(slug, pageNum, limitNum);
        return { success: true, ...result };
    }
    async getOrganizerPosts(userId) {
        const data = await this.organizersService.getOrganizerPosts(userId);
        return { success: true, data };
    }
    async createPost(userId, dto) {
        const data = await this.organizersService.createPost(userId, dto);
        return { success: true, data, message: 'Kabar berhasil dipublikasikan' };
    }
    async deletePost(userId, postId) {
        const result = await this.organizersService.deletePost(userId, postId);
        return result;
    }
    async getFollowers(userId, page, limit, search) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        const result = await this.organizersService.getFollowers(userId, pageNum, limitNum, search);
        return { success: true, ...result };
    }
};
exports.OrganizersController = OrganizersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan profil publik, feed, dan event organizer berdasarkan slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "getPublicOrganizer", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('public/:slug/follow'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle follow / unfollow organizer oleh pembeli / pengunjung' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, follow_organizer_dto_1.FollowOrganizerDto]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "toggleFollow", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/:slug/is-following'),
    (0, swagger_1.ApiOperation)({ summary: 'Cek apakah email tertentu sudah memfollow organizer' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "checkFollowing", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/:slug/posts'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan postingan / kabar publik organizer secara paginasi' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "getPublicPosts", null);
__decorate([
    (0, common_1.Get)('feed'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar post / kabar milik organizer yang login' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "getOrganizerPosts", null);
__decorate([
    (0, common_1.Post)('feed'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat postingan / kabar baru untuk organizer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "createPost", null);
__decorate([
    (0, common_1.Delete)('feed/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus postingan / kabar milik organizer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Get)('followers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar pengikut (followers) organizer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizersController.prototype, "getFollowers", null);
exports.OrganizersController = OrganizersController = __decorate([
    (0, swagger_1.ApiTags)('Organizers & Community Hub'),
    (0, common_1.Controller)('organizers'),
    __metadata("design:paramtypes", [organizers_service_1.OrganizersService])
], OrganizersController);
//# sourceMappingURL=organizers.controller.js.map