import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Controller untuk menangani routing otentikasi user platform TAQtix.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Mendaftarkan pengguna baru' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User berhasil didaftarkan.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email sudah terdaftar.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validasi input gagal.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Masuk log menggunakan email & password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login berhasil, mengembalikan token JWT.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Kredensial login salah.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mendapatkan access token baru menggunakan refresh token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token berhasil diperpanjang.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Refresh token tidak valid atau kedaluwarsa.' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Keluar log dari platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout berhasil.' })
  async logout() {
    return this.authService.logout();
  }
}
