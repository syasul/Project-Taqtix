import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Exports & Reports (Rekap Data)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('export/cross-event-summary')
  @ApiOperation({ summary: 'Export ringkasan lintas event (org-level) dalam CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File CSV berhasil di-generate.' })
  async exportCrossEventSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportCrossEventSummary(userId, from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(HttpStatus.OK).send(result.csv);
  }

  @Get('events/:id/export/orders')
  @ApiOperation({ summary: 'Export seluruh daftar pesanan event dalam CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File CSV berhasil di-generate.' })
  async exportOrders(
    @Param('id') eventId: string,
    @Query('format') format: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportOrders(eventId, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(HttpStatus.OK).send(result.csv);
  }

  @Get('events/:id/export/attendance')
  @ApiOperation({ summary: 'Export daftar kehadiran pengunjung event dalam CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File CSV berhasil di-generate.' })
  async exportAttendance(
    @Param('id') eventId: string,
    @Query('format') format: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportAttendance(eventId, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(HttpStatus.OK).send(result.csv);
  }

  @Get('events/:id/export/financial-summary')
  @ApiOperation({ summary: 'Export ringkasan keuangan event dalam CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File CSV berhasil di-generate.' })
  async exportFinancialSummary(
    @Param('id') eventId: string,
    @Query('format') format: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportFinancialSummary(eventId, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(HttpStatus.OK).send(result.csv);
  }
}
