import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokensService } from '../../modules/tokens/tokens.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly tokensService: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-Key'];

    if (!apiKey) {
      throw new UnauthorizedException('Header X-API-Key wajib disertakan');
    }

    const tokenRecord = await this.tokensService.validateApiKey(apiKey);
    if (!tokenRecord) {
      throw new UnauthorizedException('API Key tidak valid atau telah dicabut');
    }

    // Pasang metadata organizer & scopes ke object request
    request.apiToken = tokenRecord;
    request.organizer = tokenRecord.organizer;

    return true;
  }
}
