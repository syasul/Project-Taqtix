import { Controller, Get, Post, Patch, Param, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Organizer Events')
@Controller('organizer/events')
export class OrganizerEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar semua event milik organizer login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar event organizer berhasil diambil.' })
  async getOrganizerEvents(@CurrentUser('id') userId: string) {
    return this.eventsService.findAllOrganizerEvents(userId);
  }

  @Post()
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat event baru (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event berhasil dibuat.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Akses ditolak.' })
  async createEvent(@Body() dto: CreateEventDto, @CurrentUser('id') userId: string) {
    return this.eventsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah detail event (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event berhasil diperbarui.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event tidak ditemukan.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Akses ditolak.' })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.update(id, dto, userId);
  }

  @Post(':id/publish')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mempublikasikan event draft (Organizer Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event berhasil dipublikasikan.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event tidak ditemukan.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Akses ditolak.' })
  async publishEvent(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.publish(id, userId);
  }
}

