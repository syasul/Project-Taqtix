import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private readonly systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    getSystemFeatures(): Promise<{
        success: boolean;
        data: {
            allowGuestCheckoutFeature: boolean;
            allowSeatingLayoutFeature: boolean;
            allowAffiliatesProgramFeature: boolean;
            allowTicketTransferFeature: boolean;
            allowEoFeedFeature: boolean;
            allowPosCashFeature: boolean;
            allowCustomFieldsFeature: boolean;
            allowDoorprizeFeature: boolean;
        };
    }>;
    getAdminSettings(): Promise<{
        success: boolean;
        data: {
            allowGuestCheckoutFeature: boolean;
            allowSeatingLayoutFeature: boolean;
            allowAffiliatesProgramFeature: boolean;
            allowTicketTransferFeature: boolean;
            allowEoFeedFeature: boolean;
            allowPosCashFeature: boolean;
            allowCustomFieldsFeature: boolean;
            allowDoorprizeFeature: boolean;
        };
    }>;
    toggleFeature(key: string, enabled: boolean, adminId: string): Promise<{
        success: boolean;
        data: {
            key: string;
            enabled: boolean;
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
