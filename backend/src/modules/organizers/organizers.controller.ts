import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizersService } from './organizers.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { FollowOrganizerDto } from './dto/follow-organizer.dto';

@ApiTags('Organizers & Community Hub')
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Public()
  @Get('public/:slug')
  @ApiOperation({ summary: 'Mendapatkan profil publik, feed, dan event organizer berdasarkan slug' })
  async getPublicOrganizer(@Param('slug') slug: string) {
    const data = await this.organizersService.getPublicOrganizer(slug);
    return { success: true, data };
  }

  @Public()
  @Post('public/:slug/follow')
  @ApiOperation({ summary: 'Toggle follow / unfollow organizer oleh pembeli / pengunjung' })
  async toggleFollow(
    @Param('slug') slug: string,
    @Body() dto: FollowOrganizerDto,
  ) {
    const data = await this.organizersService.toggleFollow(slug, dto);
    return { success: true, ...data };
  }

  @Public()
  @Get('public/:slug/is-following')
  @ApiOperation({ summary: 'Cek apakah email tertentu sudah memfollow organizer' })
  async checkFollowing(
    @Param('slug') slug: string,
    @Query('email') email: string,
  ) {
    const data = await this.organizersService.checkFollowing(slug, email);
    return { success: true, ...data };
  }

  @Public()
  @Get('public/:slug/posts')
  @ApiOperation({ summary: 'Mendapatkan postingan / kabar publik organizer secara paginasi' })
  async getPublicPosts(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.organizersService.getPublicPosts(slug, pageNum, limitNum);
    return { success: true, ...result };
  }

  // ==========================================
  // EO PROTECTED ENDPOINTS
  // ==========================================

  @Get('feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar post / kabar milik organizer yang login' })
  async getOrganizerPosts(@CurrentUser('id') userId: string) {
    const data = await this.organizersService.getOrganizerPosts(userId);
    return { success: true, data };
  }

  @Post('feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat postingan / kabar baru untuk organizer' })
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ) {
    const data = await this.organizersService.createPost(userId, dto);
    return { success: true, data, message: 'Kabar berhasil dipublikasikan' };
  }

  @Delete('feed/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus postingan / kabar milik organizer' })
  async deletePost(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    const result = await this.organizersService.deletePost(userId, postId);
    return result;
  }

  @Get('followers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar pengikut (followers) organizer' })
  async getFollowers(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.organizersService.getFollowers(
      userId,
      pageNum,
      limitNum,
      search,
    );
    return { success: true, ...result };
  }
}
