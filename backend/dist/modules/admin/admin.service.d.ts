import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrganizers(): Promise<{
        id: string;
        name: string;
        slug: string;
        email: string;
        phone: string;
        status: "active";
        plan: string;
        segment: string | null;
        bankAccount: string | null;
        createdAt: string;
        approvedAt: string;
        approvedBy: string;
        eventCount: number;
    }[]>;
    createOrganizer(dto: {
        name: string;
        email: string;
        password?: string;
        phone?: string;
        segment?: string;
        plan?: string;
        bankAccount?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        slug: string;
        plan: string;
        segment: string | null;
        bankAccount: string | null;
        status: string;
        createdAt: string;
        eventCount: number;
    }>;
    deleteOrganizer(id: string): Promise<{
        id: string;
        message: string;
    }>;
    updateOrganizerSegmentAndPlan(organizerId: string, dto: {
        segment?: string;
        plan?: string;
        planExpiresAt?: string;
        name?: string;
        bankAccount?: string;
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
    createPartner(dto: {
        name: string;
        eventId: string;
        type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
        uniqueCode: string;
        promoCode?: string;
        commissionType?: string;
        commissionValue?: number;
        email?: string;
        password?: string;
    }): Promise<{
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
    }>;
    updatePartner(partnerId: string, dto: {
        name?: string;
        eventId?: string;
        type?: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
        uniqueCode?: string;
        promoCode?: string;
        commissionType?: string;
        commissionValue?: number;
        email?: string;
    }): Promise<{
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
    }>;
    deletePartner(id: string): Promise<{
        id: string;
        message: string;
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
    getEvents(): Promise<{
        id: string;
        title: string;
        slug: string;
        organizerName: string;
        location: string;
        status: string;
        startDate: string;
        endDate: string;
        ticketsSold: number;
        quota: number;
    }[]>;
    approveEvent(eventId: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        requireLogin: boolean;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
        allowTicketTransfer: boolean;
    }>;
    rejectEvent(eventId: string, reason?: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        location: string;
        startDate: Date;
        endDate: Date;
        bannerUrl: string;
        requireLogin: boolean;
        organizerId: string;
        status: import("@prisma/client").$Enums.EventStatus;
        geofenceLat: number | null;
        geofenceLng: number | null;
        geofenceRadius: number | null;
        allowTicketTransfer: boolean;
    }>;
}
