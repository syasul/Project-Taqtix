import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Strategy Passport untuk memvalidasi JWT access token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('TAQTIX_JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Mengurai payload JWT menjadi data user aktif di request context.
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    if (payload.role === 'partner') {
      const partner = await this.prisma.partner.findUnique({
        where: { id: payload.sub },
      });

      if (!partner) {
        throw new UnauthorizedException('Partner tidak ditemukan');
      }

      return {
        id: partner.id,
        email: partner.email || '',
        role: 'partner',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
