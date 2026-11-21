import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private readonly systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    getSystemFeatures(): Promise<{
        success: boolean;
        data: {
            allowGuestCheckoutFeature: boolean;
        };
    }>;
    getAdminSettings(): Promise<{
        success: boolean;
        data: {
            allowGuestCheckoutFeature: boolean;
        };
    }>;
    getGuestCheckoutSetting(): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
        };
    }>;
    updateGuestCheckoutSetting(enabled: boolean, adminId: string): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
        };
    }>;
}
