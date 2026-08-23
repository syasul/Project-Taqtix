import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class WorkforceService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService);
    create(eventId: string, dto: {
        name: string;
        phone: string;
        division: string;
        role: string;
        picUserId?: string;
    }, addedByUserId: string): Promise<{
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
    }>;
    findAll(eventId: string, division?: string, status?: string): Promise<{
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
    }[]>;
    getPicDashboard(eventId: string, userId: string, divisionFilter?: string): Promise<{
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
    }>;
    generateCrewLink(memberId: string): Promise<string>;
    getCrewMe(token: string): Promise<{
        name: string;
        eventName: string;
        division: string;
        role: string;
        status: string;
    }>;
    selfCheckIn(token: string, latitude: number, longitude: number): Promise<{
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
    }>;
    scanCrew(qrPayload: string): Promise<{
        success: boolean;
        name: string;
        division: string;
        role: string;
        status: string;
        checkedInAt: Date | null;
    }>;
    private calculateDistance;
}
