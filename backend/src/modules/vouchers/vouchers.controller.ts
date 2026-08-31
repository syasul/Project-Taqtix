import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Vouchers')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat voucher baru (org-wide atau event-scoped)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Voucher berhasil dibuat.' })
  async create(
    @Body() dto: CreateVoucherDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar semua voucher organisasi' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar voucher berhasil diambil.' })
  async findAll(
    @Query('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.findAll(userId, eventId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mengupdate voucher' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Voucher berhasil diupdate.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.update(id, dto, userId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menonaktifkan voucher' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Voucher berhasil dinonaktifkan.' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.deactivate(id, userId);
  }
}
