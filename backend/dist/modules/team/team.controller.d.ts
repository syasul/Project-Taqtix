import { TeamService } from './team.service';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    invite(email: string, role: string, invitedById: string): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            role: string;
            status: string;
            inviteToken: string | null;
        };
    }>;
    acceptInvite(token: string, name: string, passwordHash: string): Promise<{
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
    updateRole(memberId: string, role: string, ownerUserId: string): Promise<{
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
