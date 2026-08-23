"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkforceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let WorkforceService = class WorkforceService {
    prisma;
    configService;
    jwtService;
    constructor(prisma, configService, jwtService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async create(eventId, dto, addedByUserId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        const memberId = crypto.randomUUID();
        const qrSecret = this.configService.get('TAQTIX_QR_SECRET') || 'super-secret-qr-key-change-me';
        const qrPayload = await this.jwtService.signAsync({
            ticketId: memberId,
            eventId,
            type: 'workforce',
        }, {
            secret: qrSecret,
            expiresIn: '30d',
        });
        return this.prisma.workforceMember.create({
            data: {
                id: memberId,
                eventId,
                name: dto.name,
                phone: dto.phone,
                division: dto.division,
                role: dto.role,
                shiftId: '',
                picUserId: dto.picUserId || null,
                qrPayload,
                status: 'not_checked_in',
                addedBy: addedByUserId,
            },
        });
    }
    async findAll(eventId, division, status) {
        return this.prisma.workforceMember.findMany({
            where: {
                eventId,
                ...(division ? { division } : {}),
                ...(status ? { status } : {}),
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
    async getPicDashboard(eventId, userId, divisionFilter) {
        const member = await this.prisma.organizerMember.findFirst({
            where: { userId, status: 'active' },
        });
        let activeDivision = divisionFilter;
        if (member && member.role !== 'owner' && member.role !== 'admin') {
            const picOf = await this.prisma.workforceMember.findFirst({
                where: { eventId, picUserId: member.id },
                select: { division: true },
            });
            if (picOf) {
                activeDivision = picOf.division;
            }
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event tidak ditemukan');
        }
        const allMembers = await this.prisma.workforceMember.findMany({
            where: {
                eventId,
                ...(activeDivision ? { division: activeDivision } : {}),
            },
        });
        const expected = allMembers.length;
        const present = allMembers.filter((m) => m.status === 'present').length;
        const lateThresholdMinutes = 15;
        const shiftStartTime = event.startDate;
        const lateTime = new Date(shiftStartTime.getTime() + lateThresholdMinutes * 60000);
        const now = new Date();
        const late = allMembers.filter((m) => m.status === 'present' &&
            m.checkedInAt &&
            m.checkedInAt > lateTime).length;
        const absent = allMembers.filter((m) => m.status === 'not_checked_in' && now > lateTime).length;
        return {
            division: activeDivision || 'All Divisions',
            expected,
            present,
            late,
            absent,
            members: allMembers,
        };
    }
    async generateCrewLink(memberId) {
        const member = await this.prisma.workforceMember.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Crew tidak ditemukan');
        }
        const payload = {
            workforceMemberId: member.id,
            eventId: member.eventId,
        };
        const token = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('TAQTIX_JWT_ACCESS_SECRET'),
            expiresIn: '7d',
        });
        return `https://app.taqtix.id/crew/${token}`;
    }
    async getCrewMe(token) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('TAQTIX_JWT_ACCESS_SECRET'),
            });
        }
        catch {
            throw new common_1.ForbiddenException('SESSION_EXPIRED');
        }
        const member = await this.prisma.workforceMember.findUnique({
            where: { id: payload.workforceMemberId },
            include: { event: true },
        });
        if (!member) {
            throw new common_1.NotFoundException('Crew tidak ditemukan');
        }
        return {
            name: member.name,
            eventName: member.event.title,
            division: member.division,
            role: member.role,
            status: member.status,
        };
    }
    async selfCheckIn(token, latitude, longitude) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('TAQTIX_JWT_ACCESS_SECRET'),
            });
        }
        catch {
            throw new common_1.ForbiddenException('SESSION_EXPIRED');
        }
        const member = await this.prisma.workforceMember.findUnique({
            where: { id: payload.workforceMemberId },
            include: { event: true },
        });
        if (!member) {
            throw new common_1.NotFoundException('Crew tidak ditemukan');
        }
        if (member.status === 'present') {
            throw new common_1.ConflictException('ALREADY_CHECKED_IN');
        }
        if (member.event.geofenceLat !== null && member.event.geofenceLng !== null && member.event.geofenceRadius !== null) {
            const distance = this.calculateDistance(latitude, longitude, member.event.geofenceLat, member.event.geofenceLng);
            if (distance > member.event.geofenceRadius) {
                throw new common_1.BadRequestException('OUTSIDE_VENUE_RADIUS');
            }
        }
        return this.prisma.workforceMember.update({
            where: { id: member.id },
            data: {
                status: 'present',
                checkedInAt: new Date(),
                checkedInMethod: 'self_service',
            },
        });
    }
    async scanCrew(qrPayload) {
        const qrSecret = this.configService.get('TAQTIX_QR_SECRET') || 'super-secret-qr-key-change-me';
        let decoded;
        try {
            decoded = await this.jwtService.verifyAsync(qrPayload, {
                secret: qrSecret,
            });
        }
        catch {
            throw new common_1.BadRequestException('QR_INVALID');
        }
        if (decoded.type !== 'workforce') {
            throw new common_1.BadRequestException('QR_NOT_WORKFORCE');
        }
        const member = await this.prisma.workforceMember.findUnique({
            where: { id: decoded.ticketId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Crew tidak terdaftar');
        }
        if (member.status === 'present') {
            throw new common_1.ConflictException('QR_ALREADY_USED');
        }
        const updated = await this.prisma.workforceMember.update({
            where: { id: member.id },
            data: {
                status: 'present',
                checkedInAt: new Date(),
                checkedInMethod: 'gate_scan',
            },
        });
        return {
            success: true,
            name: updated.name,
            division: updated.division,
            role: updated.role,
            status: updated.status,
            checkedInAt: updated.checkedInAt,
        };
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) *
                Math.cos(phi2) *
                Math.sin(deltaLambda / 2) *
                Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.WorkforceService = WorkforceService;
exports.WorkforceService = WorkforceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], WorkforceService);
//# sourceMappingURL=workforce.service.js.map