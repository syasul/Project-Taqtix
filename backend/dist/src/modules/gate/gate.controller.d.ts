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
    validateTicket(dto: ValidateTicketDto, staffUserId: string): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
        buyerName: any;
        ticketCategory: any;
        eventTitle: any;
    }>;
    manualCheckin(dto: ManualCheckinDto, staffUserId: string): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
        buyerName: any;
        ticketCategory: any;
        eventTitle: any;
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
        breakdown: any;
    }>;
    assignStaff(eventId: string, dto: AssignGateStaffDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
        gateName: string;
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
        eventId: string;
        gateName: string;
    })[]>;
    assignStaffGlobal(dto: CreateGateStaffGlobalDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
        gateName: string;
    }>;
}
