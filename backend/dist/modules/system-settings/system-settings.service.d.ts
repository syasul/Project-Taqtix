import { PrismaService } from '../prisma/prisma.service';
export declare class SystemSettingsService {
    private readonly prisma;
    private readonly logger;
    private memoryCache;
    constructor(prisma: PrismaService);
    getSetting(key: string, defaultValue?: string): Promise<string>;
    setSetting(key: string, value: string, description?: string, adminId?: string): Promise<string>;
    getAllPlatformFeatures(): Promise<{
        allowGuestCheckoutFeature: boolean;
        allowSeatingLayoutFeature: boolean;
        allowAffiliatesProgramFeature: boolean;
        allowTicketTransferFeature: boolean;
        allowEoFeedFeature: boolean;
        allowPosCashFeature: boolean;
        allowCustomFieldsFeature: boolean;
        allowDoorprizeFeature: boolean;
    }>;
    isFeatureEnabled(key: string, defaultValue?: boolean): Promise<boolean>;
    setFeatureEnabled(key: string, enabled: boolean, description?: string, adminId?: string): Promise<boolean>;
    isGuestCheckoutFeatureEnabled(): Promise<boolean>;
    setGuestCheckoutFeatureEnabled(enabled: boolean, adminId?: string): Promise<boolean>;
}
