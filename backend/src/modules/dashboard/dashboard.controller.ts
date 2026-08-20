import { Controller, Get, Param, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Response } from 'express';

@ApiTags('Dashboard')
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('organizer/events/:id/dashboard')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan rangkuman data penjualan & revenue event (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rangkuman metrik dashboard.' })
  async getEventDashboard(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.dashboardService.getEventDashboard(eventId, userId);
  }

  @Get('organizer/events/:id/buyers')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan database pembeli tiket event (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Database pembeli.' })
  async getBuyers(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.dashboardService.getBuyers(eventId, userId);
  }

  @Get('organizer/events/:id/buyers/export')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengekspor data pembeli tiket ke file CSV (Organizer Only)' })
  async exportBuyers(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.dashboardService.getBuyersCsv(eventId, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="buyers-event-${eventId}.csv"`);
    return res.status(HttpStatus.OK).send(csvContent);
  }

  @Get('organizer/events/:id/channel-performance')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan data atribusi performa marketing channel (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistik performa marketing channel.' })
  async getChannelPerformance(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.dashboardService.getChannelPerformance(eventId, userId);
  }
}
