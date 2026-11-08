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
} from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { RequestTransferDto } from './dto/request-transfer.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Ticket Transfers')
@Controller()
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @ApiBearerAuth()
  @Post('tickets/:id/transfer')
  @ApiOperation({
    summary: 'Pemilik tiket mengajukan permintaan transfer kepemilikan (Wajib Login)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Permintaan transfer berhasil dibuat.',
  })
  async requestTransfer(
    @Param('id') ticketId: string,
    @Body() dto: RequestTransferDto,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.requestTransfer(ticketId, dto, user);
  }

  @Public()
  @Get('tickets/transfer/:requestToken')
  @ApiOperation({
    summary: 'Melihat ringkasan informasi transfer tiket sebelum diklaim (Public)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detail transfer tiket berhasil diambil.',
  })
  async getTransferDetails(@Param('requestToken') requestToken: string) {
    return this.transfersService.getTransferDetails(requestToken);
  }

  @ApiBearerAuth()
  @Post('tickets/transfer/:requestToken/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Penerima mengonfirmasi dan menerima transfer tiket ke akunnya (Wajib Login)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer tiket berhasil dikonfirmasi.',
  })
  async confirmTransfer(
    @Param('requestToken') requestToken: string,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.confirmTransfer(requestToken, user);
  }

  @Public()
  @Post('tickets/transfer/:requestToken/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menolak atau membatalkan permintaan transfer tiket',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer tiket dibatalkan.',
  })
  async declineTransfer(@Param('requestToken') requestToken: string) {
    return this.transfersService.declineTransfer(requestToken);
  }

  @ApiBearerAuth()
  @Roles('organizer', 'organizer_member')
  @Get('organizer/events/:id/transfers')
  @ApiOperation({
    summary: 'Mendapatkan daftar histori transfer tiket pada event',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histori transfer tiket berhasil diambil.',
  })
  async listEventTransfers(@Param('id') eventId: string) {
    return this.transfersService.listEventTransfers(eventId);
  }
}
