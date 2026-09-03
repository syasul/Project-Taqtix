import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Admin Panel Console')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('admin/organizers')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar semua organizer (Admin Only)' })
  async getOrganizers() {
    const result = await this.adminService.getOrganizers();
    return { success: true, data: result };
  }

  @Post('admin/organizers')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat akun organizer / EO baru (Admin Only)' })
  async createOrganizer(
    @Body()
    dto: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      segment?: string;
      plan?: string;
      bankAccount?: string;
    },
  ) {
    const result = await this.adminService.createOrganizer(dto);
    return { success: true, data: result };
  }

  @Delete('admin/organizers/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus akun organizer (Admin Only)' })
  async deleteOrganizer(@Param('id') id: string) {
    const result = await this.adminService.deleteOrganizer(id);
    return { success: true, data: result };
  }

  @Patch('admin/organizers/:id/segment')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah segmen dan plan organizer (Admin Only)' })
  async updateOrganizer(
    @Param('id') id: string,
    @Body()
    dto: {
      segment?: string;
      plan?: string;
      planExpiresAt?: string;
      name?: string;
      bankAccount?: string;
    },
  ) {
    const result = await this.adminService.updateOrganizerSegmentAndPlan(id, dto);
    return { success: true, data: result };
  }

  @Get('admin/partners')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan data audit/rekap partner afiliasi (Admin Only)' })
  async getPartners() {
    const result = await this.adminService.getPartnersOversight();
    return { success: true, data: result };
  }

  @Post('admin/partners')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat partner afiliasi baru (Admin Only)' })
  async createPartner(
    @Body()
    dto: {
      name: string;
      eventId: string;
      type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
      uniqueCode: string;
      promoCode?: string;
      commissionType?: string;
      commissionValue?: number;
      email?: string;
      password?: string;
    },
  ) {
    const result = await this.adminService.createPartner(dto);
    return { success: true, data: result };
  }

  @Patch('admin/partners/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data partner afiliasi (Admin Only)' })
  async updatePartner(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      eventId?: string;
      type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
      uniqueCode?: string;
      promoCode?: string;
      commissionType?: string;
      commissionValue?: number;
      email?: string;
    },
  ) {
    const result = await this.adminService.updatePartner(id, dto);
    return { success: true, data: result };
  }

  @Delete('admin/partners/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menghapus partner afiliasi (Admin Only)' })
  async deletePartner(@Param('id') id: string) {
    const result = await this.adminService.deletePartner(id);
    return { success: true, data: result };
  }

  @Post('leads')
  @Public()
  @ApiOperation({ summary: 'Mengirimkan lead baru dari landing page (Public)' })
  async createLead(
    @Body()
    dto: {
      name: string;
      organizationName: string;
      email: string;
      phone: string;
      message: string;
    },
  ) {
    const result = await this.adminService.createLead(dto);
    return { success: true, data: result };
  }

  @Get('admin/leads')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar leads masuk (Admin Only)' })
  async getLeads() {
    const result = await this.adminService.getLeads();
    return { success: true, data: result };
  }

  @Patch('admin/leads/:id/status')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah status lead pipeline (Admin Only)' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const result = await this.adminService.updateLeadStatus(id, status);
    return { success: true, data: result };
  }

  @Patch('admin/leads/:id/assign')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menugaskan admin ke lead (Admin Only)' })
  async assignLead(
    @Param('id') id: string,
    @Body('adminId') adminId: string,
  ) {
    const result = await this.adminService.assignLead(id, adminId);
    return { success: true, data: result };
  }

  @Get('admin/billing')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan rekap billing subscription (Admin Only)' })
  async getBilling() {
    const result = await this.adminService.getBillingOversight();
    return { success: true, data: result };
  }
}
