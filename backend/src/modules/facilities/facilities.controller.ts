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
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Facilities (Fasilitas Event / Add-on)')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/events/:id/facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan fasilitas/addon baru untuk event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Fasilitas berhasil ditambahkan.' })
  async create(
    @Param('id') eventId: string,
    @Body() dto: CreateFacilityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.facilitiesService.create(eventId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar fasilitas/addon untuk event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar fasilitas berhasil diambil.' })
  async findAll(@Param('id') eventId: string) {
    return this.facilitiesService.findAll(eventId);
  }

  @Patch(':facilityId')
  @ApiOperation({ summary: 'Mengupdate data fasilitas/addon' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fasilitas berhasil diupdate.' })
  async update(
    @Param('id') eventId: string,
    @Param('facilityId') facilityId: string,
    @Body() dto: UpdateFacilityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.facilitiesService.update(eventId, facilityId, dto, userId);
  }

  @Delete(':facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus fasilitas/addon' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fasilitas berhasil dihapus.' })
  async delete(
    @Param('id') eventId: string,
    @Param('facilityId') facilityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.facilitiesService.delete(eventId, facilityId, userId);
  }
}
