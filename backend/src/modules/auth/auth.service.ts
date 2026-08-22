import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

/**
 * Servis untuk memproses logika bisnis otentikasi.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Mendaftarkan user baru dengan password yang telah di-hash.
   * Secara otomatis membuat profil organizer kosong jika role yang dipilih adalah 'organizer'.
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email ini sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          role: dto.role,
        },
      });

      // Jika role organizer, buat profil organizer default
      if (dto.role === 'organizer') {
        const slug =
          dto.email.split('@')[0] + '-' + Math.floor(Math.random() * 1000);
        await tx.organizer.create({
          data: {
            userId: user.id,
            name: 'Penyelenggara Baru',
            slug,
          },
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    });
  }

  /**
   * Validasi kredensial pengguna dan mengembalikan sepasang token JWT.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Kredensial login salah');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Kredensial login salah');
    }

    return this.generateTokenPair(user.id, user.email, user.role);
  }

  /**
   * Validasi kredensial pengguna khusus untuk peran gate_staff.
   */
  async gateLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Kredensial login salah');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Kredensial login salah');
    }

    if (user.role !== 'gate_staff') {
      throw new UnauthorizedException('Akses ditolak: Hanya untuk gate_staff');
    }

    // Jika deviceId dikirim, periksa jika user sedang aktif di device lain
    if (dto.deviceId && user.activeDeviceId && user.activeDeviceId !== dto.deviceId) {
      throw new UnauthorizedException('Akun ini sedang aktif di perangkat lain');
    }

    // Update activeDeviceId dan lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activeDeviceId: dto.deviceId || null,
        lastLoginAt: new Date(),
      },
    });

    return this.generateTokenPair(user.id, user.email, user.role);
  }

  /**
   * Mengeluarkan access token baru berdasarkan refresh token yang sah.
   */
  async refresh(dto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('TAQTIX_JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Pengguna tidak ditemukan');
      }

      return this.generateTokenPair(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau kedaluwarsa',
      );
    }
  }

  /**
   * Logika logout platform.
   */
  async logout(userId?: string) {
    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          activeDeviceId: null,
          lastLogoutAt: new Date(),
        },
      });
    }
    return { message: 'Logout berhasil' };
  }

  /**
   * Mendapatkan data profil lengkap user aktif.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
            bankAccount: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return user;
  }

  /**
   * Pembantu untuk membuat access token & refresh token.
   */
  private async generateTokenPair(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('TAQTIX_JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('TAQTIX_JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
