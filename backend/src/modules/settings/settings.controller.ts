import {
  Controller,
  Get,
  Patch,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Organizer Settings')
@Controller('organizer/settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // --- ORGANIZATION ---
  @Get('organization')
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan data pengaturan organisasi' })
  async getOrganization(@CurrentUser('id') userId: string) {
    const data = await this.settingsService.getOrganization(userId);
    return { success: true, data };
  }

  @Patch('organization')
  @Permissions('edit_organization_settings')
  @ApiOperation({ summary: 'Memperbarui data organisasi (Owner Only)' })
  async updateOrganization(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; logoUrl?: string; contactEmail?: string; phone?: string },
  ) {
    const data = await this.settingsService.updateOrganization(userId, body);
    return { success: true, data };
  }

  // --- PAYMENT ---
  @Get('payment')
  @Permissions('manage_payment_settings')
  @ApiOperation({ summary: 'Mendapatkan data rekening settlement (Owner & Finance Only)' })
  async getPayment(@CurrentUser('id') userId: string) {
    const data = await this.settingsService.getPayment(userId);
    return { success: true, data };
  }

  @Patch('payment')
  @Permissions('manage_payment_settings')
  @ApiOperation({ summary: 'Memperbarui data rekening settlement (Owner & Finance Only)' })
  async updatePayment(
    @CurrentUser('id') userId: string,
    @Body() body: { bankName?: string; bankAccountNumber?: string; bankAccountHolder?: string },
  ) {
    const data = await this.settingsService.updatePayment(userId, body);
    return { success: true, data };
  }

  // --- INTEGRATIONS ---
  @Get('integrations')
  @Permissions('view_sales_revenue')
  @ApiOperation({ summary: 'Mendapatkan ID pixel & tracking integrasi' })
  async getIntegrations(@CurrentUser('id') userId: string) {
    const data = await this.settingsService.getIntegrations(userId);
    return { success: true, data };
  }

  @Patch('integrations')
  @Permissions('edit_organization_settings')
  @ApiOperation({ summary: 'Memperbarui ID pixel & tracking integrasi (Owner Only)' })
  async updateIntegrations(
    @CurrentUser('id') userId: string,
    @Body() body: { metaPixelId?: string; tiktokPixelId?: string; gaTrackingId?: string },
  ) {
    const data = await this.settingsService.updateIntegrations(userId, body);
    return { success: true, data };
  }
}
