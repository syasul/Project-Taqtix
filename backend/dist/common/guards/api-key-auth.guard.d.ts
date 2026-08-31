import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TokensService } from '../../modules/tokens/tokens.service';
export declare class ApiKeyAuthGuard implements CanActivate {
    private readonly tokensService;
    constructor(tokensService: TokensService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
