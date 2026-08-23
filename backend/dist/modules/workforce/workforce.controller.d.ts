import { WorkforceService } from './workforce.service';
export declare class WorkforceController {
    private readonly workforceService;
    constructor(workforceService: WorkforceService);
    create(eventId: string, dto: {
        name: string;
        phone: string;
        division: string;
        role: string;
        picUserId?: string;
    }, addedByUserId: string): Promise<{
        success: boolean;
        data: {
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            status: string;
            qrPayload: string;
            checkedInAt: Date | null;
            phone: string;
            division: string;
            shiftId: string;
            picUserId: string | null;
            checkedInMethod: string | null;
            addedBy: string;
        };
    }>;
    findAll(eventId: string, division?: string, status?: string): Promise<{
        success: boolean;
        data: {
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            status: string;
            qrPayload: string;
            checkedInAt: Date | null;
            phone: string;
            division: string;
            shiftId: string;
            picUserId: string | null;
            checkedInMethod: string | null;
            addedBy: string;
        }[];
    }>;
    getPicDashboard(eventId: string, userId: string, divisionFilter?: string): Promise<{
        success: boolean;
        data: {
            division: string;
            expected: number;
            present: number;
            late: number;
            absent: number;
            members: {
                role: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                eventId: string;
                status: string;
                qrPayload: string;
                checkedInAt: Date | null;
                phone: string;
                division: string;
                shiftId: string;
                picUserId: string | null;
                checkedInMethod: string | null;
                addedBy: string;
            }[];
        };
    }>;
    getCrewLink(memberId: string): Promise<{
        success: boolean;
        data: {
            link: string;
        };
    }>;
    getCrewMe(token: string): Promise<{
        success: boolean;
        data: {
            name: string;
            eventName: string;
            division: string;
            role: string;
            status: string;
        };
    }>;
    selfCheckIn(token: string, latitude: number, longitude: number): Promise<{
        success: boolean;
        data: {
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            eventId: string;
            status: string;
            qrPayload: string;
            checkedInAt: Date | null;
            phone: string;
            division: string;
            shiftId: string;
            picUserId: string | null;
            checkedInMethod: string | null;
            addedBy: string;
        };
    }>;
    scanCrew(qrPayload: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            name: string;
            division: string;
            role: string;
            status: string;
            checkedInAt: Date | null;
        };
    }>;
}
