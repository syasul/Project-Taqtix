import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { GenerateSeatsDto } from './dto/generate-seats.dto';
import { LockSeatsDto, ReleaseSeatsDto } from './dto/lock-seats.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Seating Layout & Kursi')
@Controller()
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Public()
  @Get('events/:slugOrId/seating')
  @ApiOperation({
    summary: 'Mendapatkan denah dan status kursi publik (Public)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data denah dan kursi berhasil diambil.',
  })
  async getPublicSeating(@Param('slugOrId') slugOrId: string) {
    const data = await this.seatsService.getPublicEventSeating(slugOrId);
    return { success: true, data };
  }

  @Public()
  @Post('events/:slugOrId/seating/lock')
  @ApiOperation({
    summary: 'Mengunci kursi sementara selama 10 menit saat checkout (Public)',
  })
  async lockSeats(
    @Param('slugOrId') slugOrId: string,
    @Body() dto: LockSeatsDto,
  ) {
    const result = await this.seatsService.lockSeats(slugOrId, dto.seatIds, dto.orderId);
    return { success: true, data: result };
  }

  @Public()
  @Post('events/:slugOrId/seating/release')
  @ApiOperation({
    summary: 'Melepas kuncian kursi sementara (Public)',
  })
  async releaseSeats(@Body() dto: ReleaseSeatsDto) {
    const result = await this.seatsService.releaseSeats(dto.seatIds, dto.orderId);
    return { success: true, data: result };
  }

  @Get('organizer/events/:id/seating')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan konfigurasi seksi dan kursi event (Organizer)',
  })
  async getOrganizerSeating(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.seatsService.getOrganizerSeating(eventId, userId);
    return { success: true, data };
  }

  @Post('organizer/events/:id/seating/generate')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Membuat grid kursi otomatis untuk seksi denah (Organizer)',
  })
  async generateSeats(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateSeatsDto,
  ) {
    const data = await this.seatsService.generateSectionSeats(eventId, userId, dto);
    return { success: true, data };
  }

  @Patch('organizer/events/:id/seating/seats/:seatId/toggle')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle kursi aktif/dinonaktifkan (ruang kosong/tiang) (Organizer)',
  })
  async toggleSeat(
    @Param('id') eventId: string,
    @Param('seatId') seatId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.seatsService.toggleSeatStatus(eventId, seatId, userId);
    return { success: true, data };
  }

  @Delete('organizer/events/:id/seating/sections/:sectionId')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Menghapus seksi denah dan semua kursinya (Organizer)',
  })
  async deleteSection(
    @Param('id') eventId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.seatsService.deleteSection(eventId, sectionId, userId);
    return { success: true, data };
  }
}
