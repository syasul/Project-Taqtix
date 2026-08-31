import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LineupService } from './lineup.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';
import { ReorderLineupDto } from './dto/reorder-lineup.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Line Up (Performers / Artists)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/events/:id/lineup')
export class LineupController {
  constructor(private readonly lineupService: LineupService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan pengisi acara / lineup baru' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Lineup berhasil ditambahkan.' })
  async create(
    @Param('id') eventId: string,
    @Body() dto: CreateLineupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lineupService.create(eventId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar lineup terurut untuk event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar lineup berhasil diambil.' })
  async findAll(@Param('id') eventId: string) {
    return this.lineupService.findAll(eventId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Mengubah urutan tampil lineup' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Urutan lineup berhasil diperbarui.' })
  async reorder(
    @Param('id') eventId: string,
    @Body() dto: ReorderLineupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lineupService.reorder(eventId, dto, userId);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Mengupdate data lineup' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Data lineup berhasil diupdate.' })
  async update(
    @Param('id') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateLineupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lineupService.update(eventId, itemId, dto, userId);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus lineup' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lineup berhasil dihapus.' })
  async delete(
    @Param('id') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.lineupService.delete(eventId, itemId, userId);
  }
}
