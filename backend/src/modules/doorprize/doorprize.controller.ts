import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DoorprizeService } from './doorprize.service';
import { CreateDoorprizeDto } from './dto/create-doorprize.dto';
import { DrawDoorprizeDto } from './dto/draw-doorprize.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Doorprize')
@ApiBearerAuth()
@Roles('organizer', 'organizer_member')
@Controller('organizer/events/:id/doorprize')
export class DoorprizeController {
  constructor(private readonly doorprizeService: DoorprizeService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan item hadiah doorprize baru' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Hadiah doorprize berhasil ditambahkan.' })
  async createItem(
    @Param('id') eventId: string,
    @Body() dto: CreateDoorprizeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.doorprizeService.createItem(eventId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar hadiah doorprize' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar hadiah berhasil diambil.' })
  async listItems(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.doorprizeService.listItems(eventId, userId);
  }

  @Post(':itemId/draw')
  @ApiOperation({ summary: 'Mengundi pemenang doorprize dari pengunjung yang sudah Check-In' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pengundian pemenang berhasil.' })
  async drawWinner(
    @Param('id') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: DrawDoorprizeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.doorprizeService.drawWinner(eventId, itemId, dto, userId);
  }

  @Get('winners')
  @ApiOperation({ summary: 'Mendapatkan daftar semua pemenang doorprize' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar pemenang berhasil diambil.' })
  async listWinners(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.doorprizeService.listWinners(eventId, userId);
  }
}
