import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WorkforceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Menambahkan workforce/crew baru ke event.
   */
  async create(
    eventId: string,
    dto: { name: string; phone: string; division: string; role: string; picUserId?: string },
    addedByUserId: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    const memberId = crypto.randomUUID();
    const qrSecret = this.configService.get<string>('TAQTIX_QR_SECRET') || 'super-secret-qr-key-change-me';

    // Generate signed QR payload
    const qrPayload = await this.jwtService.signAsync(
      {
        ticketId: memberId, // target key mapped in scan logic
        eventId,
        type: 'workforce',
      },
      {
        secret: qrSecret,
        expiresIn: '30d',
      },
    );

    return this.prisma.workforceMember.create({
      data: {
        id: memberId,
        eventId,
        name: dto.name,
        phone: dto.phone,
        division: dto.division,
        role: dto.role,
        shiftId: '', // Default empty shift
        picUserId: dto.picUserId || null,
        qrPayload,
        status: 'not_checked_in',
        addedBy: addedByUserId,
      },
    });
  }

  /**
   * Mendapatkan daftar crew dengan filter opsional.
   */
  async findAll(eventId: string, division?: string, status?: string) {
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

  /**
   * Dashboard PIC divisi untuk memantau absensi crew.
   */
  async getPicDashboard(eventId: string, userId: string, divisionFilter?: string) {
    // Cek apakah user adalah OrganizerMember dan PIC divisi tertentu
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
    });

    let activeDivision = divisionFilter;

    if (member && member.role !== 'owner' && member.role !== 'admin') {
      // Find what division this member is PIC of
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
      throw new NotFoundException('Event tidak ditemukan');
    }

    const allMembers = await this.prisma.workforceMember.findMany({
      where: {
        eventId,
        ...(activeDivision ? { division: activeDivision } : {}),
      },
    });

    const expected = allMembers.length;
    const present = allMembers.filter((m) => m.status === 'present').length;

    // Hitung late: shift default dimulai jam event startDate (atau config event)
    const lateThresholdMinutes = 15; // default 15 menit
    const shiftStartTime = event.startDate;
    const lateTime = new Date(shiftStartTime.getTime() + lateThresholdMinutes * 60000);
    const now = new Date();

    const late = allMembers.filter(
      (m) =>
        m.status === 'present' &&
        m.checkedInAt &&
        m.checkedInAt > lateTime,
    ).length;

    const absent = allMembers.filter(
      (m) => m.status === 'not_checked_in' && now > lateTime,
    ).length;

    return {
      division: activeDivision || 'All Divisions',
      expected,
      present,
      late,
      absent,
      members: allMembers,
    };
  }

  /**
   * Men-generate link login self-service token untuk crew.
   */
  async generateCrewLink(memberId: string) {
    const member = await this.prisma.workforceMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Crew tidak ditemukan');
    }

    const payload = {
      workforceMemberId: member.id,
      eventId: member.eventId,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('TAQTIX_JWT_ACCESS_SECRET'),
      expiresIn: '7d',
    });

    return `https://app.taqtix.id/crew/${token}`;
  }

  /**
   * Mengambil session crew dari token link.
   */
  async getCrewMe(token: string) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('TAQTIX_JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new ForbiddenException('SESSION_EXPIRED');
    }

    const member = await this.prisma.workforceMember.findUnique({
      where: { id: payload.workforceMemberId },
      include: { event: true },
    });

    if (!member) {
      throw new NotFoundException('Crew tidak ditemukan');
    }

    return {
      name: member.name,
      eventName: member.event.title,
      division: member.division,
      role: member.role,
      status: member.status,
    };
  }

  /**
   * Crew melakukan check-in mandiri dengan validasi koordinat lokasi.
   */
  async selfCheckIn(token: string, latitude: number, longitude: number) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('TAQTIX_JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new ForbiddenException('SESSION_EXPIRED');
    }

    const member = await this.prisma.workforceMember.findUnique({
      where: { id: payload.workforceMemberId },
      include: { event: true },
    });

    if (!member) {
      throw new NotFoundException('Crew tidak ditemukan');
    }

    if (member.status === 'present') {
      throw new ConflictException('ALREADY_CHECKED_IN');
    }

    // Geofencing verification
    if (member.event.geofenceLat !== null && member.event.geofenceLng !== null && member.event.geofenceRadius !== null) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        member.event.geofenceLat,
        member.event.geofenceLng,
      );

      if (distance > member.event.geofenceRadius) {
        throw new BadRequestException('OUTSIDE_VENUE_RADIUS');
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

  /**
   * Scan crew dari gate/alat pemindai staff pintu.
   */
  async scanCrew(qrPayload: string) {
    const qrSecret = this.configService.get<string>('TAQTIX_QR_SECRET') || 'super-secret-qr-key-change-me';
    let decoded;
    try {
      decoded = await this.jwtService.verifyAsync(qrPayload, {
        secret: qrSecret,
      });
    } catch {
      throw new BadRequestException('QR_INVALID');
    }

    if (decoded.type !== 'workforce') {
      throw new BadRequestException('QR_NOT_WORKFORCE');
    }

    const member = await this.prisma.workforceMember.findUnique({
      where: { id: decoded.ticketId },
    });

    if (!member) {
      throw new NotFoundException('Crew tidak terdaftar');
    }

    if (member.status === 'present') {
      throw new ConflictException('QR_ALREADY_USED');
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

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }
}
