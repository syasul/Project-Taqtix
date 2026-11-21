import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private memoryCache: Map<string, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string, defaultValue: string = ''): Promise<string> {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }
    try {
      const setting = await (this.prisma as any).systemSetting.findUnique({
        where: { key },
      });
      const val = setting ? setting.value : defaultValue;
      this.memoryCache.set(key, val);
      return val;
    } catch (err: any) {
      this.logger.warn(`Could not read SystemSetting "${key}": ${err?.message}`);
      return defaultValue;
    }
  }

  async setSetting(
    key: string,
    value: string,
    description?: string,
    adminId?: string,
  ): Promise<string> {
    try {
      const updated = await (this.prisma as any).systemSetting.upsert({
        where: { key },
        create: { key, value, description },
        update: { value, description },
      });
      this.memoryCache.set(key, updated.value);

      if (adminId) {
        try {
          await this.prisma.auditLog.create({
            data: {
              adminId,
              action: 'UPDATE_SYSTEM_SETTING',
              targetId: key,
              targetType: 'system_setting',
              details: { key, value, description },
            },
          });
        } catch {}
      }

      return updated.value;
    } catch (err: any) {
      this.logger.error(
        `Could not write SystemSetting "${key}": ${err?.message}`,
      );
      this.memoryCache.set(key, value);
      return value;
    }
  }

  /**
   * Status fitur Guest Checkout (Pembelian tiket tanpa login) untuk EO.
   * Default: true (ON).
   * - Jika ON: EO dapat mengatur per event apakah butuh login atau tidak.
   * - Jika OFF: Fitur ini tidak ada di dashboard EO dan semua pembelian tiket wajib login.
   */
  async isGuestCheckoutFeatureEnabled(): Promise<boolean> {
    const val = await this.getSetting('ALLOW_GUEST_CHECKOUT', 'true');
    return val === 'true';
  }

  async setGuestCheckoutFeatureEnabled(
    enabled: boolean,
    adminId?: string,
  ): Promise<boolean> {
    await this.setSetting(
      'ALLOW_GUEST_CHECKOUT',
      enabled ? 'true' : 'false',
      'Kontrol global fitur pembelian tiket tanpa login (Guest Checkout) untuk EO',
      adminId,
    );
    return enabled;
  }
}
