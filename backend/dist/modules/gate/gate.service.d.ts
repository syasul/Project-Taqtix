import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AssignGateStaffDto } from './dto/assign-gate-staff.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { SyncBatchDto } from './dto/sync-batch.dto';
export declare class GateService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService);
    private verifyEventOwnership;
    assignStaff(eventId: string, dto: AssignGateStaffDto, organizerUserId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
        gateName: string;
    }>;
    getStaffList(eventId: string, organizerUserId: string): Promise<({
        user: {
            email: string;
            role: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
        gateName: string;
    })[]>;
    validateTicket(dto: ValidateTicketDto, staffUserId: string): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
        buyerName: string;
        ticketCategory: string;
        eventTitle: string;
        ticket: {
            id: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            checkedInAt: Date | null;
            checkedOutAt: Date | null;
            orderItem: {
                attendeeName: string;
                ticketCategory: {
                    name: string;
                };
            };
        };
    }>;
    manualCheckin(dto: ManualCheckinDto, staffUserId: string): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
        buyerName: string;
        ticketCategory: string;
        eventTitle: string;
        ticket: {
            id: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            checkedInAt: Date | null;
            checkedOutAt: Date | null;
            orderItem: {
                attendeeName: string;
                ticketCategory: {
                    name: string;
                };
            };
        };
    }>;
    syncBatch(dto: SyncBatchDto, staffUserId: string): Promise<{
        success: boolean;
        message: string;
        syncedCount: number;
    }>;
    getAttendance(eventId: string, organizerUserId: string): Promise<{
        eventId: string;
        eventTitle: string;
        totalTicketsIssued: number;
        totalTicketsCheckedIn: number;
        attendanceRate: number;
        breakdown: {
            ticketCategoryId: string;
            ticketCategoryName: string;
            issuedCount: number;
            checkedInCount: number;
            attendanceRate: number;
        }[];
    }>;
    getManifest(eventId: string, staffUserId: string): Promise<{
        ticketId: string;
        qrPayload: string;
        attendeeName: string;
        ticketCategoryName: string;
    }[]>;
    getAssignedEvents(userId: string): Promise<{
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
    }[]>;
}
