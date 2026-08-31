import { TokensService } from './tokens.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
export declare class TokensController {
    private readonly tokensService;
    constructor(tokensService: TokensService);
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
}
