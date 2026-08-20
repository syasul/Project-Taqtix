import { Controller, Get, Post, Param, Body, HttpStatus, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Request, Response } from 'express';

@ApiTags('Affiliates')
@Controller()
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Public()
  @Get('r/:code')
  @ApiOperation({ summary: 'Mencatat klik afiliasi dan redirect ke landing page event (Public)' })
  async redirectAffiliate(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Tangkap IP Address dan User Agent dari request
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const redirectUrl = await this.affiliatesService.registerClickAndGetUrl(code, ipAddress, userAgent);
    return res.redirect(redirectUrl);
  }

  @Post('events/:id/affiliates')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendaftarkan partner afiliasi baru (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Partner afiliasi berhasil terdaftar.' })
  async createAffiliate(
    @Param('id') eventId: string,
    @Body() dto: CreateAffiliateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.affiliatesService.create(eventId, dto, userId);
  }

  @Get('events/:id/affiliates')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar partner afiliasi event (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar partner afiliasi.' })
  async getAffiliates(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.affiliatesService.findAll(eventId, userId);
  }

  @Get('events/:id/affiliates/leaderboard')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan leaderboard penjualan partner afiliasi (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard partner afiliasi.' })
  async getLeaderboard(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.affiliatesService.getLeaderboard(eventId, userId);
  }
}
