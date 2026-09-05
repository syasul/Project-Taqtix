import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CRMService } from './crm.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@ApiTags('Audience CRM & Segments')
@Controller()
export class CRMController {
  constructor(private readonly crmService: CRMService) {}

  @Post('organizer/events/:eventId/segments')
  @ApiBearerAuth()
  @Permissions('manage_audience_segments')
  @ApiOperation({ summary: 'Membuat segmen pembeli baru' })
  async createSegment(
    @Param('eventId') eventId: string,
    @Body() dto: CreateSegmentDto,
  ) {
    const result = await this.crmService.createSegment(eventId, dto.name, dto.criteria);
    return { success: true, data: result };
  }

  @Get('organizer/events/:eventId/segments')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan daftar semua segmen event' })
  async findSegments(@Param('eventId') eventId: string) {
    const result = await this.crmService.findSegments(eventId);
    return { success: true, data: result };
  }

  @Get('organizer/segments/:segmentId/members')
  @ApiBearerAuth()
  @Permissions('manage_audience_segments')
  @ApiOperation({ summary: 'Mendapatkan daftar anggota pembeli yang match kriteria segmen' })
  async getSegmentMembers(@Param('segmentId') segmentId: string) {
    const result = await this.crmService.getSegmentMembers(segmentId);
    return { success: true, data: result };
  }

  @Post('organizer/segments/:segmentId/broadcast')
  @ApiBearerAuth()
  @Permissions('manage_audience_segments')
  @ApiOperation({ summary: 'Mengirim broadcast pesan ke segmen (WhatsApp / Email)' })
  async createBroadcast(
    @Param('segmentId') segmentId: string,
    @Body() dto: CreateBroadcastDto,
  ) {
    const result = await this.crmService.createBroadcast(
      segmentId,
      dto.message,
      dto.channel || 'whatsapp',
      dto.subject,
    );
    return { success: true, data: result };
  }

  @Get('organizer/broadcasts/:jobId/status')
  @ApiBearerAuth()
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mengecek status progres broadcast' })
  async getBroadcastStatus(@Param('jobId') jobId: string) {
    const result = await this.crmService.getBroadcastStatus(jobId);
    return result;
  }
}
