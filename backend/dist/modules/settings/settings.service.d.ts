import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrganizerId;
    getOrganization(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        logoUrl: string | null;
        contactEmail: string | null;
    }>;
    updateOrganization(userId: string, data: {
        name?: string;
        logoUrl?: string;
        contactEmail?: string;
        phone?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        logoUrl: string | null;
        contactEmail: string | null;
    }>;
    getPayment(userId: string): Promise<{
        bankName: string;
        bankAccountNumber: string;
        bankAccountHolder: string;
    }>;
    updatePayment(userId: string, data: {
        bankName?: string;
        bankAccountNumber?: string;
        bankAccountHolder?: string;
    }): Promise<{
        bankName: string | null;
        bankAccountNumber: string | null;
        bankAccountHolder: string | null;
    }>;
    getIntegrations(userId: string): Promise<{
        metaPixelId: any;
        tiktokPixelId: any;
        gaTrackingId: any;
    }>;
    updateIntegrations(userId: string, data: {
        metaPixelId?: string;
        tiktokPixelId?: string;
        gaTrackingId?: string;
    }): Promise<import("@prisma/client/runtime/library").JsonValue>;
}
