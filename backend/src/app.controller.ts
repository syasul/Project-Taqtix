import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controller utama aplikasi untuk menyajikan endpoint root dan healthcheck.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mendapatkan pesan selamat datang root api' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Memeriksa status kesehatan dan kelayakan servis backend' })
  @ApiResponse({ status: 200, description: 'Servis backend berjalan normal.' })
  getHealth() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
