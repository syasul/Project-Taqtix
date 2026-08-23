import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    updateOrganizerSegmentAndPlan(organizerId: string, dto: {
        segment?: string;
        plan?: string;
        planExpiresAt?: string;
    }): Promise<{
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
    }>;
    createLead(dto: {
        name: string;
        organizationName: string;
        email: string;
        phone: string;
        message: string;
    }): Promise<{
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
    }>;
    getLeads(): Promise<{
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
    }[]>;
    updateLeadStatus(leadId: string, status: string): Promise<{
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
    }>;
    assignLead(leadId: string, adminId: string): Promise<{
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
    }>;
    getBillingOversight(): Promise<{
        id: string;
        name: string;
        email: string;
        plan: string;
        segment: string;
        status: string;
        planStartedAt: Date | null;
        planExpiresAt: Date | null;
    }[]>;
    getPartnersOversight(): Promise<({
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
    })[]>;
}
