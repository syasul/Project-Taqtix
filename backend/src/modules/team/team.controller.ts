import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Organizer Team')
@Controller('organizer/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('invite')
  @Permissions('manage_team_access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengundang member baru ke organizer (Owner Only)' })
  async invite(
    @Body('email') email: string,
    @Body('role') role: string,
    @CurrentUser('id') invitedById: string,
  ) {
    const result = await this.teamService.invite(email, role, invitedById);
    return { success: true, data: result };
  }

  @Post('accept-invite/:token')
  @Public()
  @ApiOperation({ summary: 'Menerima undangan tim dan melengkapi data password' })
  async acceptInvite(
    @Param('token') token: string,
    @Body('name') name: string,
    @Body('password') passwordHash: string,
  ) {
    const result = await this.teamService.acceptInvite(token, name, passwordHash);
    return { success: true, data: result };
  }

  @Get()
  @Permissions('view_sales_revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar semua member tim' })
  async getTeam(@CurrentUser('id') userId: string) {
    const result = await this.teamService.getTeam(userId);
    return { success: true, data: result };
  }

  @Patch(':memberId/role')
  @Permissions('manage_team_access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah peran member tim (Owner Only)' })
  async updateRole(
    @Param('memberId') memberId: string,
    @Body('role') role: string,
    @CurrentUser('id') ownerUserId: string,
  ) {
    const result = await this.teamService.updateRole(memberId, role, ownerUserId);
    return { success: true, data: result };
  }

  @Delete(':memberId')
  @Permissions('manage_team_access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus member dari tim (Owner Only)' })
  async removeMember(
    @Param('memberId') memberId: string,
    @CurrentUser('id') ownerUserId: string,
  ) {
    await this.teamService.removeMember(memberId, ownerUserId);
    return { success: true, message: 'Member berhasil dihapus' };
  }
}
