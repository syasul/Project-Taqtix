import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkforceService } from './workforce.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Workforce Management')
@Controller()
export class WorkforceController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Post('organizer/events/:eventId/workforce')
  @ApiBearerAuth()
  @Permissions('manage_workforce_crew')
  @ApiOperation({ summary: 'Menambahkan crew baru untuk event' })
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: { name: string; phone: string; division: string; role: string; picUserId?: string },
    @CurrentUser('id') addedByUserId: string,
  ) {
    const result = await this.workforceService.create(eventId, dto, addedByUserId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:eventId/workforce')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan daftar semua crew untuk event' })
  async findAll(
    @Param('eventId') eventId: string,
    @Query('division') division?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.workforceService.findAll(eventId, division, status);
    return { success: true, data: result };
  }

  @Get('organizer/events/:eventId/workforce/pic-dashboard')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan dashboard PIC status divisi' })
  async getPicDashboard(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Query('division') divisionFilter?: string,
  ) {
    const result = await this.workforceService.getPicDashboard(eventId, userId, divisionFilter);
    return { success: true, data: result };
  }

  @Get('organizer/workforce/:memberId/link')
  @ApiBearerAuth()
  @Permissions('manage_workforce_crew')
  @ApiOperation({ summary: 'Mendapatkan link self check-in untuk crew' })
  async getCrewLink(@Param('memberId') memberId: string) {
    const link = await this.workforceService.generateCrewLink(memberId);
    return { success: true, data: { link } };
  }

  @Get('crew/me')
  @Public()
  @ApiOperation({ summary: 'Mendapatkan data session crew berdasarkan token' })
  async getCrewMe(@Query('token') token: string) {
    const result = await this.workforceService.getCrewMe(token);
    return { success: true, data: result };
  }

  @Post('crew/self-check-in')
  @Public()
  @ApiOperation({ summary: 'Crew melakukan check-in mandiri via GPS' })
  async selfCheckIn(
    @Body('token') token: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    const result = await this.workforceService.selfCheckIn(token, latitude, longitude);
    return { success: true, data: result };
  }

  @Post('gate/workforce-scan')
  @Public() // Or guarded by gate staff
  @ApiOperation({ summary: 'Gate staff melakukan scanning QR Code crew' })
  async scanCrew(@Body('qrPayload') qrPayload: string) {
    const result = await this.workforceService.scanCrew(qrPayload);
    return { success: true, data: result };
  }
}
