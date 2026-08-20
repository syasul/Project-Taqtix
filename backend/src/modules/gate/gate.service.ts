import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AssignGateStaffDto } from './dto/assign-gate-staff.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { SyncBatchDto } from './dto/sync-batch.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper untuk verifikasi bahwa user adalah pemilik event terkait.
   */
  private async verifyEventOwnership(eventId: string, organizerUserId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId: organizerUserId },
    });

    if (!organizer) {
      throw new ForbiddenException('Akses ditolak: Anda bukan organizer');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    if (event.organizerId !== organizer.id) {
      throw new ForbiddenException(
        'Akses ditolak: Anda bukan pemilik event ini',
      );
    }

    return event;
  }

  /**
   * Mendaftarkan staf gerbang baru untuk event tertentu.
   */
  async assignStaff(
    eventId: string,
    dto: AssignGateStaffDto,
    organizerUserId: string,
  ) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    const staffUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!staffUser) {
      throw new NotFoundException('Staf dengan email tersebut tidak ditemukan');
    }

    // Jika user masih bertipe 'user' biasa, ubah rolenya menjadi 'gate_staff'
    if (staffUser.role === 'user') {
      await this.prisma.user.update({
        where: { id: staffUser.id },
        data: { role: 'gate_staff' },
      });
    }

    // Hubungkan staf ke event
    const existingStaff = await this.prisma.gateStaff.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: staffUser.id,
        },
      },
    });

    if (existingStaff) {
      return existingStaff;
    }

    return this.prisma.gateStaff.create({
      data: {
        eventId,
        userId: staffUser.id,
        gateName: 'Pintu Utama', // Nilai default untuk model GateStaff
      },
    });
  }

  /**
   * Mendapatkan semua daftar staf gerbang untuk event tertentu.
   */
  async getStaffList(eventId: string, organizerUserId: string) {
    await this.verifyEventOwnership(eventId, organizerUserId);

    return this.prisma.gateStaff.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Memvalidasi QR payload tiket dan melakukan pencatatan scan (Check-in).
   */
  async validateTicket(dto: ValidateTicketDto, staffUserId: string) {
    let decoded: any;

    // 1. Verifikasi Signature JWT QR Payload
    try {
      const qrSecret =
        this.configService.get<string>('QR_SIGNING_SECRET') ||
        this.configService.get<string>('QR_SECRET') ||
        'super-secret-qr-key-change-me';
      decoded = await this.jwtService.verifyAsync(dto.qrPayload, {
        secret: qrSecret,
      });
    } catch (error) {
      throw new HttpException(
        {
          code: 'QR_INVALID',
          message: 'QR Code tidak valid, tanda tangan palsu, atau kedaluwarsa',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const { ticketId } = decoded;

    return this.prisma.$transaction(async (tx) => {
      // 2. Cari tiket
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          orderItem: {
            include: {
              ticketCategory: true,
              order: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Tiket tidak terdaftar di sistem');
      }

      // 3. Verifikasi apakah staffUserId terdaftar untuk scan event ini
      const isOrganizer = await tx.organizer.findFirst({
        where: {
          userId: staffUserId,
          id: ticket.orderItem.ticketCategory.eventId,
        },
      });

      if (!isOrganizer) {
        const isAssignedStaff = await tx.gateStaff.findUnique({
          where: {
            eventId_userId: {
              eventId: ticket.eventId,
              userId: staffUserId,
            },
          },
        });

        if (!isAssignedStaff) {
          throw new ForbiddenException(
            'Akses ditolak: Anda tidak ditugaskan di gerbang event ini',
          );
        }
      }

      // 4. Verifikasi status tiket
      if (ticket.status === TicketStatus.CHECKED_IN) {
        // Catat ScanLog gagal (DUPLICATE)
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'DUPLICATE',
          },
        });
        throw new HttpException(
          {
            code: 'QR_ALREADY_USED',
            message: 'Tiket sudah pernah digunakan / check-in sebelumnya',
          },
          HttpStatus.CONFLICT,
        );
      }

      if (ticket.status !== TicketStatus.VALID) {
        // Catat ScanLog gagal (INVALID)
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'INVALID',
          },
        });
        throw new HttpException(
          {
            code: 'QR_INVALID',
            message: `Tiket tidak aktif (Status: ${ticket.status})`,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // 5. Sukses Check-in: Update status tiket ke CHECKED_IN & Buat ScanLog
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.CHECKED_IN,
          checkedInAt: new Date(),
          checkedInBy: staffUserId,
        },
      });

      await tx.scanLog.create({
        data: {
          ticketId: ticket.id,
          scannedById: staffUserId,
          result: 'VALID',
        },
      });

      return {
        success: true,
        message: 'Check-in berhasil! Selamat menikmati acara.',
        ticketId: ticket.id,
        buyerName: ticket.orderItem.attendeeName,
        ticketCategory: ticket.orderItem.ticketCategory.name,
        eventTitle: ticket.orderItem.ticketCategory.name, // Event title or default
      };
    });
  }

  /**
   * Validasi tiket secara manual dengan mengetik kode tiket / UUID tiket.
   */
  async manualCheckin(dto: ManualCheckinDto, staffUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Cari berdasarkan ID (UUID) atau jika qrPayload sama persis
      const ticket = await tx.ticket.findFirst({
        where: {
          OR: [{ id: dto.code }, { qrPayload: dto.code }],
        },
        include: {
          orderItem: {
            include: {
              ticketCategory: true,
              order: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Tiket tidak terdaftar di sistem');
      }

      // Verifikasi otorisasi staff
      const isOrganizer = await tx.organizer.findFirst({
        where: {
          userId: staffUserId,
          id: ticket.orderItem.ticketCategory.eventId,
        },
      });

      if (!isOrganizer) {
        const isAssignedStaff = await tx.gateStaff.findUnique({
          where: {
            eventId_userId: {
              eventId: ticket.eventId,
              userId: staffUserId,
            },
          },
        });

        if (!isAssignedStaff) {
          throw new ForbiddenException(
            'Akses ditolak: Anda tidak ditugaskan di gerbang event ini',
          );
        }
      }

      // Verifikasi status tiket
      if (ticket.status === TicketStatus.CHECKED_IN) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'DUPLICATE',
          },
        });
        throw new BadRequestException(
          'Tiket sudah pernah digunakan / check-in sebelumnya',
        );
      }

      if (ticket.status !== TicketStatus.VALID) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'INVALID',
          },
        });
        throw new BadRequestException(
          `Tiket tidak aktif (Status: ${ticket.status})`,
        );
      }

      // Update status & buat ScanLog
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.CHECKED_IN,
          checkedInAt: new Date(),
          checkedInBy: staffUserId,
        },
      });

      await tx.scanLog.create({
        data: {
          ticketId: ticket.id,
          scannedById: staffUserId,
          result: 'VALID',
        },
      });

      return {
        success: true,
        message: 'Check-in manual berhasil!',
        ticketId: ticket.id,
        buyerName: ticket.orderItem.attendeeName,
        ticketCategory: ticket.orderItem.ticketCategory.name,
        eventTitle: ticket.orderItem.ticketCategory.name,
      };
    });
  }

  /**
   * Menerima sinkronisasi logs pemindaian offline secara batch.
   */
  async syncBatch(dto: SyncBatchDto, staffUserId: string) {
    let successCount = 0;

    for (const log of dto.logs) {
      try {
        // Dekode payload (menggunakan QR secret khusus)
        const qrSecret =
          this.configService.get<string>('QR_SIGNING_SECRET') ||
          this.configService.get<string>('QR_SECRET') ||
          'super-secret-qr-key-change-me';
        const decoded = await this.jwtService.verifyAsync(log.qrPayload, {
          secret: qrSecret,
        });

        const { ticketId } = decoded;

        await this.prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.findUnique({
            where: { id: ticketId },
            include: {
              orderItem: {
                include: {
                  ticketCategory: true,
                },
              },
            },
          });

          if (!ticket) return;

          // Cek penugasan staff gerbang
          const isOrganizer = await tx.organizer.findFirst({
            where: {
              userId: staffUserId,
              id: ticket.orderItem.ticketCategory.eventId,
            },
          });

          if (!isOrganizer) {
            const isAssignedStaff = await tx.gateStaff.findUnique({
              where: {
                eventId_userId: {
                  eventId: ticket.eventId,
                  userId: staffUserId,
                },
              },
            });
            if (!isAssignedStaff) return;
          }

          // Cek jika status tiket sudah ter-checkin, catat scanlog tapi jangan error-out agar batch berlanjut
          if (ticket.status === TicketStatus.CHECKED_IN) {
            await tx.scanLog.create({
              data: {
                ticketId: ticket.id,
                scannedById: staffUserId,
                result: 'DUPLICATE',
                scannedAt: new Date(log.scannedAt),
                synced: false,
              },
            });
            return;
          }

          if (ticket.status === TicketStatus.VALID) {
            await tx.ticket.update({
              where: { id: ticket.id },
              data: {
                status: TicketStatus.CHECKED_IN,
                checkedInAt: new Date(log.scannedAt),
                checkedInBy: staffUserId,
              },
            });

            await tx.scanLog.create({
              data: {
                ticketId: ticket.id,
                scannedById: staffUserId,
                result: 'VALID',
                scannedAt: new Date(log.scannedAt),
                synced: false,
              },
            });

            successCount++;
          }
        });
      } catch (error) {
        console.warn(
          `[Sync Batch] Gagal memproses sinkronisasi satu baris log:`,
          error,
        );
      }
    }

    return {
      success: true,
      message: 'Sinkronisasi batch scan selesai',
      syncedCount: successCount,
    };
  }

  /**
   * Mendapatkan real-time counter kehadiran checked-in vs total kuota tiket event.
   */
  async getAttendance(eventId: string, organizerUserId: string) {
    const event = await this.verifyEventOwnership(eventId, organizerUserId);

    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
      },
    });

    const ticketCategories = await this.prisma.ticketCategory.findMany({
      where: { eventId },
    });

    const totalTicketsIssued = tickets.length;
    const totalTicketsCheckedIn = tickets.filter(
      (t) => t.status === TicketStatus.CHECKED_IN,
    ).length;

    const breakdown = ticketCategories.map((tc) => {
      const categoryTickets = tickets.filter(
        (t) => t.orderItem.ticketCategoryId === tc.id,
      );
      const issued = categoryTickets.length;
      const checkedIn = categoryTickets.filter(
        (t) => t.status === TicketStatus.CHECKED_IN,
      ).length;

      return {
        ticketCategoryId: tc.id,
        ticketCategoryName: tc.name,
        issuedCount: issued,
        checkedInCount: checkedIn,
        attendanceRate:
          issued > 0
            ? parseFloat(((checkedIn / issued) * 100).toFixed(2))
            : 0.0,
      };
    });

    const attendanceRate =
      totalTicketsIssued > 0
        ? parseFloat(
            ((totalTicketsCheckedIn / totalTicketsIssued) * 100).toFixed(2),
          )
        : 0.0;

    return {
      eventId: event.id,
      eventTitle: event.title,
      totalTicketsIssued,
      totalTicketsCheckedIn,
      attendanceRate,
      breakdown,
    };
  }

  /**
   * Mendapatkan manifest seluruh tiket aktif untuk download sinkronisasi offline.
   */
  async getManifest(eventId: string, staffUserId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    const isOrganizer = await this.prisma.organizer.findFirst({
      where: { userId: staffUserId, id: event.organizerId },
    });

    if (!isOrganizer) {
      const isAssignedStaff = await this.prisma.gateStaff.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: staffUserId,
          },
        },
      });

      if (!isAssignedStaff) {
        throw new ForbiddenException(
          'Akses ditolak: Anda tidak ditugaskan di gerbang event ini',
        );
      }
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        eventId,
        status: TicketStatus.VALID,
      },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
      },
    });

    return tickets.map((t) => ({
      ticketId: t.id,
      qrPayload: t.qrPayload,
      attendeeName: t.orderItem.attendeeName,
      ticketCategoryName: t.orderItem.ticketCategory.name,
    }));
  }

  /**
   * Mendapatkan daftar event yang ditugaskan ke staff gerbang.
   */
  async getAssignedEvents(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (user.role === 'organizer') {
      const organizer = await this.prisma.organizer.findFirst({
        where: { userId },
      });
      if (!organizer) return [];
      return this.prisma.event.findMany({
        where: { organizerId: organizer.id },
      });
    }

    // Role is gate_staff
    const gateStaffs = await this.prisma.gateStaff.findMany({
      where: { userId },
      include: { event: true },
    });

    return gateStaffs.map((gs) => gs.event);
  }
}
