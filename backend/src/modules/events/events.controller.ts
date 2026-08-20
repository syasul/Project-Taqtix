import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar semua event publik yang terbit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar event publik berhasil diambil.' })
  async getPublicEvents() {
    return this.eventsService.findAllPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Mendapatkan detail event publik berdasarkan slug' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detail event publik berhasil diambil.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event tidak ditemukan.' })
  async getPublicEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.findOnePublicBySlug(slug);
  }
}
