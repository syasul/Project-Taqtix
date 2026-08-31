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
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let TokensService = class TokensService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrganizerAndVerifyOwner(userId) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
            include: { organizer: true },
        });
        if (member) {
            if (member.role !== 'owner') {
                throw new common_1.ForbiddenException('Hanya peran Owner yang berhak mengelola API token.');
            }
            return member.organizer;
        }
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new common_1.ForbiddenException('Pengguna tidak memiliki profil organizer');
        }
        return organizer;
    }
    async generateToken(dto, userId) {
        const organizer = await this.getOrganizerAndVerifyOwner(userId);
        const rawSecret = crypto.randomBytes(24).toString('hex');
        const fullToken = `taq_live_${rawSecret}`;
        const tokenHash = crypto.createHash('sha256').update(fullToken).digest('hex');
        const tokenPreview = `...${fullToken.slice(-8)}`;
        const scopes = dto.scopes && dto.scopes.length > 0
            ? dto.scopes
            : ['read:events', 'read:orders', 'read:attendance'];
        const record = await this.prisma.apiToken.create({
            data: {
                organizerId: organizer.id,
                name: dto.name,
                tokenHash,
                tokenPreview,
                scopes,
                createdBy: userId,
            },
        });
        return {
            id: record.id,
            name: record.name,
            token: fullToken,
            tokenPreview: record.tokenPreview,
            scopes: record.scopes,
            createdAt: record.createdAt,
        };
    }
    async listTokens(userId) {
        const organizer = await this.getOrganizerAndVerifyOwner(userId);
        return this.prisma.apiToken.findMany({
            where: {
                organizerId: organizer.id,
            },
            select: {
                id: true,
                name: true,
                tokenPreview: true,
                scopes: true,
                lastUsedAt: true,
                createdBy: true,
                createdAt: true,
                revokedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async revokeToken(id, userId) {
        const organizer = await this.getOrganizerAndVerifyOwner(userId);
        const token = await this.prisma.apiToken.findUnique({
            where: { id },
        });
        if (!token || token.organizerId !== organizer.id) {
            throw new common_1.NotFoundException('API Token tidak ditemukan');
        }
        return this.prisma.apiToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }
    async validateApiKey(apiKey) {
        const tokenHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const tokenRecord = await this.prisma.apiToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
            },
            include: {
                organizer: true,
            },
        });
        if (!tokenRecord) {
            return null;
        }
        this.prisma.apiToken.update({
            where: { id: tokenRecord.id },
            data: { lastUsedAt: new Date() },
        }).catch(() => { });
        return tokenRecord;
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map