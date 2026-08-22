import { GateService } from './gate.service';
import { AssignGateStaffDto } from './dto/assign-gate-staff.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { SyncBatchDto } from './dto/sync-batch.dto';
export declare class CreateGateStaffGlobalDto extends AssignGateStaffDto {
    eventId: string;
}
export declare class GateController {
    private readonly gateService;
    constructor(gateService: GateService);
    getAssignedEvents(staffUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        title: string;
        description: string | null;
        bannerUrl: string;
        location: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.EventStatus;
        organizerId: string;
    }[]>;
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
    getAttendance(eventId: string, userId: string): Promise<{
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
    assignStaff(eventId: string, dto: AssignGateStaffDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        gateName: string;
        eventId: string;
    }>;
    getStaffList(eventId: string, userId: string): Promise<({
        user: {
            id: string;
            email: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        gateName: string;
        eventId: string;
    })[]>;
    assignStaffGlobal(dto: CreateGateStaffGlobalDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        gateName: string;
        eventId: string;
    }>;
}
