import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { Response } from 'express';

@ApiTags('Dashboard & Analytics')
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('organizer/overview')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan rangkuman eksekutif multi-event organizer (Cached)' })
  async getOverview(@CurrentUser('id') userId: string) {
    const result = await this.dashboardService.getOverview(userId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:id/dashboard')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan rangkuman metrik utama dashboard event' })
  async getEventDashboard(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getEventDashboard(eventId, userId);
  }

  @Get('organizer/events/:id/buyers')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan database pembeli tiket event' })
  async getBuyers(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getBuyers(eventId, userId);
  }

  @Get('organizer/events/:id/buyers/export')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mengekspor data pembeli tiket ke file CSV' })
  async exportBuyers(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.dashboardService.getBuyersCsv(eventId, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="buyers-event-${eventId}.csv"`,
    );
    return res.status(HttpStatus.OK).send(csvContent);
  }

  @Get('organizer/events/:id/channel-performance')
  @ApiBearerAuth()
  @Permissions('view_analytics_growth')
  @ApiOperation({ summary: 'Mendapatkan data atribusi performa marketing channel' })
  async getChannelPerformance(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getChannelPerformance(eventId, userId);
  }

  // --- ANALYTICS REPORTS ---

  @Get('organizer/events/:id/analytics/sales')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan laporan analitik penjualan' })
  async getSalesAnalytics(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dashboardService.getSalesAnalytics(eventId, userId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:id/analytics/distribution')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan laporan analitik distribusi marketing' })
  async getDistributionAnalytics(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dashboardService.getDistributionAnalytics(eventId, userId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:id/analytics/audience')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan laporan analitik demografi audiens' })
  async getAudienceAnalytics(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.prismaGetAudience(eventId, userId);
    return { success: true, data: result };
  }

  // Fallback direct reference to bypass scope wrapper if needed
  private async prismaGetAudience(eventId: string, userId: string) {
    return this.dashboardService.getAudienceAnalytics(eventId, userId);
  }

  @Get('organizer/events/:id/analytics/performance')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan laporan performa konversi funnel' })
  async getPerformanceAnalytics(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dashboardService.getPerformanceAnalytics(eventId, userId);
    return { success: true, data: result };
  }

  // --- GROWTH MARKETING & AD-SPEND ---

  @Post('organizer/events/:id/ad-spend')
  @ApiBearerAuth()
  @Permissions('manage_partners_affiliate')
  @ApiOperation({ summary: 'Mencatat pengeluaran iklan marketing' })
  async recordAdSpend(
    @Param('id') eventId: string,
    @Body() dto: { channel: string; amount: number; periodStart: string; periodEnd: string },
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dashboardService.recordAdSpend(eventId, dto, userId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:id/growth-dashboard')
  @ApiBearerAuth()
  @Permissions('view_analytics_growth')
  @ApiOperation({ summary: 'Mendapatkan data dashboard performa ROAS & afiliasi' })
  async getGrowthDashboard(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dashboardService.getGrowthDashboard(eventId, userId);
    return { success: true, data: result };
  }

  // --- TRACKING ENDPOINTS ---

  @Post('track/page-view')
  @Public()
  @ApiOperation({ summary: 'Mencatat traffic page view event' })
  async trackPageView(@Body('eventId') eventId: string) {
    await this.dashboardService.trackEvent(eventId, 'page_view');
    return { success: true };
  }

  @Post('track/checkout-started')
  @Public()
  @ApiOperation({ summary: 'Mencatat traffic checkout start event' })
  async trackCheckoutStarted(@Body('eventId') eventId: string) {
    await this.dashboardService.trackEvent(eventId, 'checkout_start');
    return { success: true };
  }
}
