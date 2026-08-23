import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
export declare class TeamService {
    private prisma;
    private authService;
    constructor(prisma: PrismaService, authService: AuthService);
    invite(email: string, role: string, invitedByUserId: string): Promise<{
        id: string;
        email: string;
        role: string;
        status: string;
        inviteToken: string | null;
    }>;
    acceptInvite(token: string, name: string, passwordHash: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getTeam(userId: string): Promise<({
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
    })[]>;
    updateRole(memberId: string, role: string, ownerUserId: string): Promise<{
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
    }>;
    removeMember(memberId: string, ownerUserId: string): Promise<{
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
    }>;
}
