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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const team_service_1 = require("./team.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const invite_team_member_dto_1 = require("./dto/invite-team-member.dto");
const accept_invite_dto_1 = require("./dto/accept-invite.dto");
const update_team_role_dto_1 = require("./dto/update-team-role.dto");
let TeamController = class TeamController {
    teamService;
    constructor(teamService) {
        this.teamService = teamService;
    }
    async invite(dto, invitedById) {
        const result = await this.teamService.invite(dto.email, dto.role, invitedById);
        return { success: true, data: result };
    }
    async acceptInvite(token, dto) {
        const result = await this.teamService.acceptInvite(token, dto.name, dto.password);
        return { success: true, data: result };
    }
    async getTeam(userId) {
        const result = await this.teamService.getTeam(userId);
        return { success: true, data: result };
    }
    async updateRole(memberId, dto, ownerUserId) {
        const result = await this.teamService.updateRole(memberId, dto.role, ownerUserId);
        return { success: true, data: result };
    }
    async removeMember(memberId, ownerUserId) {
        await this.teamService.removeMember(memberId, ownerUserId);
        return { success: true, message: 'Member berhasil dihapus' };
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Post)('invite'),
    (0, permissions_decorator_1.Permissions)('manage_team_access'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengundang member baru ke organizer (Owner Only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_team_member_dto_1.InviteTeamMemberDto, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('accept-invite/:token'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menerima undangan tim dan melengkapi data password' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, accept_invite_dto_1.AcceptInviteDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('view_sales_revenue'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar semua member tim' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Patch)(':memberId/role'),
    (0, permissions_decorator_1.Permissions)('manage_team_access'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah peran member tim (Owner Only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_team_role_dto_1.UpdateTeamRoleDto, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':memberId'),
    (0, permissions_decorator_1.Permissions)('manage_team_access'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus member dari tim (Owner Only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "removeMember", null);
exports.TeamController = TeamController = __decorate([
    (0, swagger_1.ApiTags)('Organizer Team'),
    (0, common_1.Controller)('organizer/team'),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map