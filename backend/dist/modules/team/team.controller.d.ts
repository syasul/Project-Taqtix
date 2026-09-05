import { TeamService } from './team.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UpdateTeamRoleDto } from './dto/update-team-role.dto';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    invite(dto: InviteTeamMemberDto, invitedById: string): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            role: string;
            status: string;
            inviteToken: string | null;
        };
    }>;
    acceptInvite(token: string, dto: AcceptInviteDto): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    getTeam(userId: string): Promise<{
        success: boolean;
        data: ({
            user: {
                lastLoginAt: Date | null;
            } | null;
        } & {
            email: string;
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            organizerId: string;
            status: string;
            inviteToken: string | null;
            invitedBy: string;
            invitedAt: Date;
            joinedAt: Date | null;
            removedAt: Date | null;
        })[];
    }>;
    updateRole(memberId: string, dto: UpdateTeamRoleDto, ownerUserId: string): Promise<{
        success: boolean;
        data: {
            email: string;
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            organizerId: string;
            status: string;
            inviteToken: string | null;
            invitedBy: string;
            invitedAt: Date;
            joinedAt: Date | null;
            removedAt: Date | null;
        };
    }>;
    removeMember(memberId: string, ownerUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
