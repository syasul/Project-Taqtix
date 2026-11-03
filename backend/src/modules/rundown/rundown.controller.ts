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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RundownService } from './rundown.service';
import { CreateRundownDto } from './dto/create-rundown.dto';
import { UpdateRundownDto } from './dto/update-rundown.dto';
import { ReorderRundownDto } from './dto/reorder-rundown.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Rundown & Agenda')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/events/:id/rundown')
export class RundownController {
  constructor(private readonly rundownService: RundownService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan sesi agenda rundown baru' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Agenda berhasil ditambahkan.',
  })
  async create(
    @Param('id') eventId: string,
    @Body() dto: CreateRundownDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.rundownService.create(eventId, dto, userId);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar susunan rundown acara' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar rundown berhasil diambil.',
  })
  async findAll(@Param('id') eventId: string) {
    const data = await this.rundownService.findAll(eventId);
    return { success: true, data };
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Mengubah urutan tampil susunan rundown' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Urutan rundown berhasil diperbarui.',
  })
  async reorder(
    @Param('id') eventId: string,
    @Body() dto: ReorderRundownDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.rundownService.reorder(eventId, dto, userId);
    return { success: true, data };
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Memperbarui rincian agenda rundown' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rundown berhasil diperbarui.',
  })
  async update(
    @Param('id') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateRundownDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.rundownService.update(eventId, itemId, dto, userId);
    return { success: true, data };
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus sesi agenda dari susunan rundown' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agenda berhasil dihapus.',
  })
  async delete(
    @Param('id') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rundownService.delete(eventId, itemId, userId);
  }
}

