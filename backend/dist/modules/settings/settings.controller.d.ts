import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getOrganization(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            phone: string | null;
            logoUrl: string | null;
            contactEmail: string | null;
        };
    }>;
    updateOrganization(userId: string, body: {
        name?: string;
        logoUrl?: string;
        contactEmail?: string;
        phone?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            phone: string | null;
            logoUrl: string | null;
            contactEmail: string | null;
        };
    }>;
    getPayment(userId: string): Promise<{
        success: boolean;
        data: {
            bankName: string;
            bankAccountNumber: string;
            bankAccountHolder: string;
        };
    }>;
    updatePayment(userId: string, body: {
        bankName?: string;
        bankAccountNumber?: string;
        bankAccountHolder?: string;
    }): Promise<{
        success: boolean;
        data: {
            bankName: string | null;
            bankAccountNumber: string | null;
            bankAccountHolder: string | null;
        };
    }>;
    getIntegrations(userId: string): Promise<{
        success: boolean;
        data: {
            metaPixelId: any;
            tiktokPixelId: any;
            gaTrackingId: any;
        };
    }>;
    updateIntegrations(userId: string, body: {
        metaPixelId?: string;
        tiktokPixelId?: string;
        gaTrackingId?: string;
    }): Promise<{
        success: boolean;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
