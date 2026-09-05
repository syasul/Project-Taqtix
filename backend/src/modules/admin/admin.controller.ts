import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Admin Panel Console')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('admin/dashboard')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ringkasan platform & analitik lintas organizer (Admin Only)' })
  async getDashboard() {
    const result = await this.adminService.getDashboard();
    return { success: true, data: result };
  }

  @Get('admin/organizers')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar semua organizer (Admin Only)' })
  async getOrganizers() {
    const result = await this.adminService.getOrganizers();
    return { success: true, data: result };
  }

  @Get('admin/organizers/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan detail organizer beserta list event miliknya (Admin Only)' })
  async getOrganizerById(@Param('id') id: string) {
    const result = await this.adminService.getOrganizerById(id);
    return { success: true, data: result };
  }

  @Post('admin/organizers/:id/approve')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menyetujui pendaftaran organizer baru (Admin Only)' })
  async approveOrganizer(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.approveOrganizer(id, adminId);
    return { success: true, data: result };
  }

  @Post('admin/organizers/:id/suspend')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menangguhkan akun organizer (Admin Only)' })
  async suspendOrganizer(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.suspendOrganizer(id, adminId);
    return { success: true, data: result };
  }

  @Patch('admin/organizers/:id/plan')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah paket langganan (plan) organizer (Admin Only)' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.updatePlan(id, dto.plan, adminId);
    return { success: true, data: result };
  }

  @Post('admin/organizers')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat akun organizer / EO baru (Admin Only)' })
  async createOrganizer(@Body() dto: CreateOrganizerDto) {
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
    @Body() dto: UpdateOrganizerDto,
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
  async createPartner(@Body() dto: CreatePartnerDto) {
    const result = await this.adminService.createPartner(dto);
    return { success: true, data: result };
  }

  @Patch('admin/partners/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data partner afiliasi (Admin Only)' })
  async updatePartner(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDto,
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Mengirimkan lead baru dari landing page (Public)' })
  async createLead(@Body() dto: CreateLeadDto) {
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

  @Get('admin/events')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan seluruh event untuk moderasi (Admin Only)' })
  async getEvents() {
    const result = await this.adminService.getEvents();
    return { success: true, data: result };
  }

  @Post('admin/events/:id/approve')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menyetujui event untuk dipublikasikan (Admin Only)' })
  async approveEvent(@Param('id') id: string) {
    const result = await this.adminService.approveEvent(id);
    return { success: true, data: result };
  }

  @Post('admin/events/:id/reject')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menolak penerbitan event (Admin Only)' })
  async rejectEvent(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.adminService.rejectEvent(id, reason);
    return { success: true, data: result };
  }

  @Post('admin/events/:id/force-unpublish')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force unpublish event bermasalah (Admin Only)' })
  async forceUnpublishEvent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.forceUnpublishEvent(id, adminId);
    return { success: true, data: result };
  }

  @Get('admin/orders')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({ name: 'q', required: false, description: 'Kata kunci pencarian order (order ID / email buyer / nama attendee)' })
  @ApiOperation({ summary: 'Pencarian pesanan lintas seluruh organizer (Admin Only)' })
  async searchOrders(@Query('q') q?: string) {
    const result = await this.adminService.searchOrders(q);
    return { success: true, data: result };
  }

  @Get('admin/settlements')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar settlement yang perlu diproses (Admin Only)' })
  async getSettlements() {
    const result = await this.adminService.getSettlements();
    return { success: true, data: result };
  }

  @Post('admin/settlements/:id/mark-paid')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menandai settlement sudah ditransfer manual (Admin Only)' })
  async markSettlementPaid(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.markSettlementPaid(id, adminId);
    return { success: true, data: result };
  }

  @Get('admin/audit-log')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan log audit aktivitas admin (Admin Only)' })
  async getAuditLogs() {
    const result = await this.adminService.getAuditLogs();
    return { success: true, data: result };
  }
}
