import {
  Controller,
  Get,
  Post,
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
  ApiProperty,
} from '@nestjs/swagger';
import { GateService } from './gate.service';
import { AssignGateStaffDto } from './dto/assign-gate-staff.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { SyncBatchDto } from './dto/sync-batch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGateStaffGlobalDto extends AssignGateStaffDto {
  @ApiProperty({ example: 'event-uuid-here', description: 'ID event' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;
}

@ApiTags('Gate & Scanner')
@Controller()
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get('gate/events')
  @Roles('gate_staff', 'organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan daftar event yang ditugaskan ke staff gerbang',
  })
  async getAssignedEvents(@CurrentUser('id') staffUserId: string) {
    return this.gateService.getAssignedEvents(staffUserId);
  }

  @Post('gate/scan')
  @Roles('gate_staff', 'organizer')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Validasi QR tiket elektronik untuk check-in masuk (Staff/Organizer)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check-in sukses atau tiket ditolak.',
  })
  async validateTicket(
    @Body() dto: ValidateTicketDto,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.gateService.validateTicket(dto, staffUserId);
  }

  @Post('gate/manual-checkin')
  @Roles('gate_staff', 'organizer')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fallback check-in menggunakan input kode tiket manual',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check-in manual sukses.',
  })
  async manualCheckin(
    @Body() dto: ManualCheckinDto,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.gateService.manualCheckin(dto, staffUserId);
  }

  @Post('gate/scan/batch')
  @Roles('gate_staff', 'organizer')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sinkronisasi offline scan logs secara massal' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sinkronisasi sukses.' })
  async syncBatch(
    @Body() dto: SyncBatchDto,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.gateService.syncBatch(dto, staffUserId);
  }

  @Get('gate/events/:eventId/live-count')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan data statistik kehadiran real-time' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistik kehadiran.' })
  async getAttendance(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gateService.getAttendance(eventId, userId);
  }

  @Get('gate/events/:eventId/manifest')
  @Roles('gate_staff', 'organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Mendapatkan data manifest tiket untuk sinkronisasi offline (Staff/Organizer)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manifest data tiket.' })
  async getManifest(
    @Param('eventId') eventId: string,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.gateService.getManifest(eventId, staffUserId);
  }

  @Post('events/:id/gate-staff')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendaftarkan staff gerbang ke event tertentu' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Staf gerbang berhasil didaftarkan.',
  })
  async assignStaff(
    @Param('id') eventId: string,
    @Body() dto: AssignGateStaffDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gateService.assignStaff(eventId, dto, userId);
  }

  @Get('events/:id/gate-staff')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar staff gerbang event tertentu' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar staf gerbang.' })
  async getStaffList(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gateService.getStaffList(eventId, userId);
  }

  @Post('gate-staff')
  @Roles('organizer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendaftarkan staff gerbang (Global path fallback)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Staf gerbang berhasil didaftarkan.',
  })
  async assignStaffGlobal(
    @Body() dto: CreateGateStaffGlobalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gateService.assignStaff(
      dto.eventId,
      { email: dto.email },
      userId,
    );
  }
}
