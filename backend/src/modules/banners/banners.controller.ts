import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('Banners Promosi')
@Controller()
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Mendapatkan daftar banner slider aktif untuk landing page (Publik)' })
  @ApiQuery({ name: 'position', required: false, description: 'Filter posisi banner (default: home_hero)' })
  async getPublicBanners(@Query('position') position?: string) {
    const banners = await this.bannersService.getPublicBanners(position);
    return { success: true, data: banners };
  }

  @Get('admin/banners')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan semua banner untuk dikelola Main Admin (Admin Only)' })
  async getAdminBanners() {
    const banners = await this.bannersService.getAdminBanners();
    return { success: true, data: banners };
  }

  @Post('admin/banners')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menambahkan banner slider promosi baru (Admin Only)' })
  async createBanner(@Body() dto: CreateBannerDto) {
    const banner = await this.bannersService.createBanner(dto);
    return { success: true, data: banner };
  }

  @Patch('admin/banners/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data banner slider (Admin Only)' })
  async updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const banner = await this.bannersService.updateBanner(id, dto);
    return { success: true, data: banner };
  }

  @Delete('admin/banners/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus banner slider (Admin Only)' })
  async deleteBanner(@Param('id') id: string) {
    const result = await this.bannersService.deleteBanner(id);
    return { success: true, data: result };
  }
}
