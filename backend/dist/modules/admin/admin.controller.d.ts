import { AdminService } from './admin.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        success: boolean;
        data: {
            totalOrganizers: number;
            activeOrganizers: number;
            totalEvents: number;
            publishedEvents: number;
            totalRevenue: number;
            platformFee: number;
        };
    }>;
    getOrganizers(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            email: string;
            phone: string;
            status: string;
            plan: string;
            segment: string | null;
            bankAccount: string | null;
            createdAt: string;
            approvedAt: string | null;
            approvedBy: string | null;
            eventCount: number;
        }[];
    }>;
    getOrganizerById(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            email: string;
            phone: string;
            status: string;
            plan: string;
            segment: string | null;
            bankAccount: string | null;
            createdAt: string;
            approvedAt: string | null;
            approvedBy: string | null;
            events: {
                id: string;
                title: string;
                slug: string;
                status: string;
                location: string;
                startDate: string;
                endDate: string;
                ticketsSold: number;
                quota: number;
            }[];
        };
    }>;
    approveOrganizer(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            phone: string | null;
            status: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
    }>;
    suspendOrganizer(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            phone: string | null;
            status: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
    }>;
    updatePlan(id: string, dto: UpdatePlanDto, adminId: string): Promise<{
        success: boolean;
        data: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            phone: string | null;
            status: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
    }>;
    createOrganizer(dto: CreateOrganizerDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    deleteOrganizer(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            message: string;
        };
    }>;
    updateOrganizer(id: string, dto: UpdateOrganizerDto): Promise<{
        success: boolean;
        data: {
            segment: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            slug: string;
            phone: string | null;
            status: string;
            bankAccount: string | null;
            plan: string;
            planStartedAt: Date | null;
            planExpiresAt: Date | null;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
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
    createPartner(dto: CreatePartnerDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updatePartner(id: string, dto: UpdatePartnerDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    deletePartner(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            message: string;
        };
    }>;
    createLead(dto: CreateLeadDto): Promise<{
        success: boolean;
        data: {
            email: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string;
            status: string;
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
            phone: string;
            status: string;
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
            phone: string;
            status: string;
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
            phone: string;
            status: string;
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
    getEvents(): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    approveEvent(id: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            status: import("@prisma/client").$Enums.EventStatus;
            location: string;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
            requireLogin: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            adminSeoKeywords: string | null;
            seoPriority: string | null;
            organizerId: string;
            geofenceLat: number | null;
            geofenceLng: number | null;
            geofenceRadius: number | null;
            allowTicketTransfer: boolean;
        };
    }>;
    rejectEvent(id: string, reason?: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            status: import("@prisma/client").$Enums.EventStatus;
            location: string;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
            requireLogin: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            adminSeoKeywords: string | null;
            seoPriority: string | null;
            organizerId: string;
            geofenceLat: number | null;
            geofenceLng: number | null;
            geofenceRadius: number | null;
            allowTicketTransfer: boolean;
        };
    }>;
    forceUnpublishEvent(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            status: import("@prisma/client").$Enums.EventStatus;
            location: string;
            startDate: Date;
            endDate: Date;
            bannerUrl: string;
            requireLogin: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            adminSeoKeywords: string | null;
            seoPriority: string | null;
            organizerId: string;
            geofenceLat: number | null;
            geofenceLng: number | null;
            geofenceRadius: number | null;
            allowTicketTransfer: boolean;
        };
    }>;
    searchOrders(q?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            eventId: string;
            eventTitle: string;
            organizerName: string;
            buyerEmail: string;
            status: string;
            totalAmount: number;
            promoCode: string | null;
            createdAt: string;
            items: {
                categoryName: string;
                qty: number;
                attendeeName: string;
                attendeePhone: string;
            }[];
        }[];
    }>;
    getSettlements(): Promise<{
        success: boolean;
        data: ({
            organizer: {
                id: string;
                name: string;
                bankAccount: string | null;
            };
            event: {
                title: string;
                id: string;
                endDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            eventId: string;
            organizerId: string;
            paidAt: Date | null;
            grossRevenue: number;
            platformFee: number;
            affiliateCommissionTotal: number;
            netAmount: number;
            paidBy: string | null;
        })[];
    }>;
    markSettlementPaid(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            eventId: string;
            organizerId: string;
            paidAt: Date | null;
            grossRevenue: number;
            platformFee: number;
            affiliateCommissionTotal: number;
            netAmount: number;
            paidBy: string | null;
        };
    }>;
    getAuditLogs(): Promise<{
        success: boolean;
        data: {
            id: string;
            action: string;
            adminId: string;
            targetId: string;
            targetType: string;
            details: import("@prisma/client/runtime/library").JsonValue | null;
            timestamp: Date;
        }[];
    }>;
}
