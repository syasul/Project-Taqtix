import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('System Settings & Platform Feature Control')
@Controller()
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  /**
   * Endpoint Publik untuk mengecek feature flags platform
   * Dipanggil oleh EO Dashboard dan Frontend Web
   */
  @Public()
  @Get('system/features')
  @ApiOperation({ summary: 'Mendapatkan status feature flags sistem platform' })
  async getSystemFeatures() {
    const data = await this.systemSettingsService.getAllPlatformFeatures();
    return {
      success: true,
      data,
    };
  }

  /**
   * Endpoint Admin untuk mendapatkan status seluruh pengaturan sistem
   */
  @Get('admin/settings')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mendapatkan seluruh pengaturan sistem platform (Admin Only)',
  })
  async getAdminSettings() {
    const data = await this.systemSettingsService.getAllPlatformFeatures();
    return {
      success: true,
      data,
    };
  }

  /**
   * Endpoint Admin untuk mengubah status toggle fitur apapun
   */
  @Patch('admin/settings/toggle')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mengubah status toggle fitur platform (Admin Only)',
  })
  async toggleFeature(
    @Body('key') key: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.systemSettingsService.setFeatureEnabled(
      key,
      Boolean(enabled),
      undefined,
      adminId,
    );
    return {
      success: true,
      data: {
        key,
        enabled: result,
      },
    };
  }

  /**
   * Endpoint Admin untuk mendapatkan status fitur Guest Checkout
   */
  @Get('admin/settings/guest-checkout')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Mendapatkan status fitur Guest Checkout untuk Event Organizer (Admin Only)',
  })
  async getGuestCheckoutSetting() {
    const enabled =
      await this.systemSettingsService.isGuestCheckoutFeatureEnabled();
    return {
      success: true,
      data: {
        enabled,
      },
    };
  }

  /**
   * Endpoint Admin untuk mengubah status fitur Guest Checkout
   */
  @Patch('admin/settings/guest-checkout')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Mengaktifkan / menonaktifkan fitur Guest Checkout untuk Event Organizer (Admin Only)',
  })
  async updateGuestCheckoutSetting(
    @Body('enabled') enabled: boolean,
    @CurrentUser('id') adminId: string,
  ) {
    const result =
      await this.systemSettingsService.setGuestCheckoutFeatureEnabled(
        Boolean(enabled),
        adminId,
      );
    return {
      success: true,
      data: {
        enabled: result,
      },
    };
  }
}
