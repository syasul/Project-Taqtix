"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
let TeamService = class TeamService {
    prisma;
    authService;
    constructor(prisma, authService) {
        this.prisma = prisma;
        this.authService = authService;
    }
    async invite(email, role, invitedByUserId) {
        const inviterMember = await this.prisma.organizerMember.findFirst({
            where: { userId: invitedByUserId, status: 'active' },
        });
        let organizerId = inviterMember?.organizerId;
        if (!organizerId) {
            const org = await this.prisma.organizer.findUnique({
                where: { userId: invitedByUserId },
            });
            if (!org) {
                throw new common_1.ForbiddenException('Anda tidak memiliki profil organizer');
            }
            organizerId = org.id;
        }
        const existingMember = await this.prisma.organizerMember.findUnique({
            where: {
                organizerId_email: {
                    organizerId,
                    email,
                },
            },
        });
        if (existingMember && existingMember.status !== 'removed') {
            throw new common_1.ConflictException('EMAIL_ALREADY_MEMBER');
        }
        const inviteToken = crypto.randomBytes(16).toString('hex');
        const invitedAt = new Date();
        const data = {
            organizerId,
            email,
            role,
            status: 'pending',
            inviteToken,
            invitedBy: invitedByUserId,
            invitedAt,
        };
        let member;
        if (existingMember && existingMember.status === 'removed') {
            member = await this.prisma.organizerMember.update({
                where: { id: existingMember.id },
                data,
            });
        }
        else {
            member = await this.prisma.organizerMember.create({
                data,
            });
        }
        console.log(`[INVITE MAIL] Link: https://app.taqtix.id/team/accept/${inviteToken}`);
        return {
            id: member.id,
            email: member.email,
            role: member.role,
            status: member.status,
            inviteToken: member.inviteToken,
        };
    }
    async acceptInvite(token, name, passwordHash) {
        const member = await this.prisma.organizerMember.findUnique({
            where: { inviteToken: token },
        });
        if (!member) {
            throw new common_1.NotFoundException('Token undangan tidak valid');
        }
        if (member.status === 'active') {
            throw new common_1.ConflictException('INVITE_ALREADY_USED');
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (member.invitedAt < sevenDaysAgo) {
            throw new common_1.GoneException('INVITE_EXPIRED');
        }
        let user = await this.prisma.user.findUnique({
            where: { email: member.email },
        });
        const hashedPassword = await bcrypt.hash(passwordHash, 10);
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: member.email,
                    passwordHash: hashedPassword,
                    role: 'organizer_member',
                },
            });
        }
        else {
            if (user.role !== 'admin') {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        passwordHash: hashedPassword,
                        role: 'organizer_member',
                    },
                });
            }
        }
        await this.prisma.organizerMember.update({
            where: { id: member.id },
            data: {
                userId: user.id,
                status: 'active',
                joinedAt: new Date(),
                inviteToken: null,
            },
        });
        return this.authService.generateTokenPair(user.id, user.email, user.role);
    }
    async getTeam(userId) {
        const activeMember = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
        });
        let organizerId = activeMember?.organizerId;
        if (!organizerId) {
            const org = await this.prisma.organizer.findUnique({
                where: { userId },
            });
            if (!org) {
                throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
            }
            organizerId = org.id;
        }
        return this.prisma.organizerMember.findMany({
            where: {
                organizerId,
            },
            include: {
                user: {
                    select: {
                        lastLoginAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
    async updateRole(memberId, role, ownerUserId) {
        const member = await this.prisma.organizerMember.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member tidak ditemukan');
        }
        if (member.role === 'owner' && role !== 'owner') {
            const otherOwnersCount = await this.prisma.organizerMember.count({
                where: {
                    organizerId: member.organizerId,
                    role: 'owner',
                    status: 'active',
                    id: { not: memberId },
                },
            });
            if (otherOwnersCount === 0) {
                throw new common_1.ConflictException('LAST_OWNER_CANNOT_DEMOTE');
            }
        }
        return this.prisma.organizerMember.update({
            where: { id: memberId },
            data: { role },
        });
    }
    async removeMember(memberId, ownerUserId) {
        const member = await this.prisma.organizerMember.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member tidak ditemukan');
        }
        if (member.role === 'owner') {
            const otherOwnersCount = await this.prisma.organizerMember.count({
                where: {
                    organizerId: member.organizerId,
                    role: 'owner',
                    status: 'active',
                    id: { not: memberId },
                },
            });
            if (otherOwnersCount === 0) {
                throw new common_1.ConflictException('LAST_OWNER_CANNOT_REMOVE');
            }
        }
        return this.prisma.organizerMember.update({
            where: { id: memberId },
            data: {
                status: 'removed',
                removedAt: new Date(),
                userId: null,
            },
        });
    }
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService])
], TeamService);
//# sourceMappingURL=team.service.js.map