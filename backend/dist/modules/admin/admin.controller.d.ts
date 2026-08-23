import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    updateOrganizer(id: string, dto: {
        segment?: string;
        plan?: string;
        planExpiresAt?: string;
    }): Promise<{
        success: boolean;
        data: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
        };
    }>;
    createLead(dto: {
        name: string;
        organizationName: string;
        email: string;
        phone: string;
        message: string;
    }): Promise<{
        success: boolean;
        data: {
            email: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            status: string;
            phone: string;
            organizationName: string;
            assignedTo: string | null;
        };
    }>;
    getLeads(): Promise<{
        success: boolean;
        data: {
            email: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            status: string;
            phone: string;
            organizationName: string;
            assignedTo: string | null;
        }[];
    }>;
    updateLeadStatus(id: string, status: string): Promise<{
        success: boolean;
        data: {
            email: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            status: string;
            phone: string;
            organizationName: string;
            assignedTo: string | null;
        };
    }>;
    assignLead(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            email: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            status: string;
            phone: string;
            organizationName: string;
            assignedTo: string | null;
        };
    }>;
    getBilling(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            plan: string;
            segment: string;
            status: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
        }[];
    }>;
    getPartners(): Promise<{
        success: boolean;
        data: ({
            event: {
                title: string;
            };
        } & {
            promoCode: string | null;
            type: import("@prisma/client").$Enums.PartnerType;
            email: string | null;
            id: string;
            passwordHash: string | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            uniqueCode: string;
            eventId: string;
            commissionType: string;
            commissionValue: number;
            clicks: number;
            conversions: number;
            revenueGenerated: number;
            commissionEarned: number;
        })[];
    }>;
}
