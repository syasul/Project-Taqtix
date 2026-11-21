import { PrismaService } from '../prisma/prisma.service';
export declare class SystemSettingsService {
    private readonly prisma;
    private readonly logger;
    private memoryCache;
    constructor(prisma: PrismaService);
    getSetting(key: string, defaultValue?: string): Promise<string>;
    setSetting(key: string, value: string, description?: string, adminId?: string): Promise<string>;
    isGuestCheckoutFeatureEnabled(): Promise<boolean>;
    setGuestCheckoutFeatureEnabled(enabled: boolean, adminId?: string): Promise<boolean>;
}
