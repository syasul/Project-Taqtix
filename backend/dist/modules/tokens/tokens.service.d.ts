import { PrismaService } from '../prisma/prisma.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
export declare class TokensService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerAndVerifyOwner;
    generateToken(dto: CreateApiTokenDto, userId: string): Promise<{
        id: string;
        name: string;
        token: string;
        tokenPreview: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }>;
    listTokens(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        tokenPreview: string;
        lastUsedAt: Date | null;
        createdBy: string;
        revokedAt: Date | null;
    }[]>;
    revokeToken(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        organizerId: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        tokenHash: string;
        tokenPreview: string;
        lastUsedAt: Date | null;
        createdBy: string;
        revokedAt: Date | null;
    }>;
    validateApiKey(apiKey: string): Promise<({
        organizer: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        organizerId: string;
        scopes: import("@prisma/client/runtime/library").JsonValue;
        tokenHash: string;
        tokenPreview: string;
        lastUsedAt: Date | null;
        createdBy: string;
        revokedAt: Date | null;
    }) | null>;
}
