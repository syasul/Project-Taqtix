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
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ReorderCustomFieldsDto } from './dto/reorder-custom-fields.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Custom Form Fields (Formulir Tambahan)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/events/:id/custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan field formulir baru untuk event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Field formulir berhasil ditambahkan.' })
  async create(
    @Param('id') eventId: string,
    @Body() dto: CreateCustomFieldDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customFieldsService.create(eventId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar field formulir untuk event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar field formulir berhasil diambil.' })
  async findAll(@Param('id') eventId: string) {
    return this.customFieldsService.findAll(eventId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Mengubah urutan tampilan field formulir' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Urutan field formulir berhasil diperbarui.' })
  async reorder(
    @Param('id') eventId: string,
    @Body() dto: ReorderCustomFieldsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customFieldsService.reorder(eventId, dto, userId);
  }

  @Patch(':fieldId')
  @ApiOperation({ summary: 'Mengupdate field formulir' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Field formulir berhasil diupdate.' })
  async update(
    @Param('id') eventId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customFieldsService.update(eventId, fieldId, dto, userId);
  }

  @Delete(':fieldId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus field formulir' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Field formulir berhasil dihapus.' })
  async delete(
    @Param('id') eventId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customFieldsService.delete(eventId, fieldId, userId);
  }
}
