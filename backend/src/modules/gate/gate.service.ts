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
      // 1. Pessimistic Row Lock (SELECT ... FOR UPDATE)
      // Mencegah double check-in / race condition jika 1 barcode di-scan bersamaan di beberapa gerbang
      if (typeof tx.$queryRaw === 'function') {
        try {
          await tx.$queryRaw`
            SELECT id FROM "Ticket"
            WHERE id = ${ticketId}
            FOR UPDATE
          `;
        } catch (lockError) {
          // Abaikan jika database engine test/mock tidak mendukung query FOR UPDATE
        }
      }

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

      // Periksa apakah tiket diblokir oleh penyelenggara
      if (ticket.isBlocked) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'BLOCKED',
          },
        });
        throw new HttpException(
          {
            code: 'TICKET_BLOCKED',
            message:
              ticket.blockedReason ||
              'Tiket telah dinonaktifkan / diblokir oleh panitia',
          },
          HttpStatus.FORBIDDEN,
        );
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
      const isOut = dto.action === 'out';

      if (isOut) {
        if (ticket.status !== TicketStatus.CHECKED_IN) {
          await tx.scanLog.create({
            data: {
              ticketId: ticket.id,
              scannedById: staffUserId,
              result: 'INVALID_OUT',
            },
          });
          throw new HttpException(
            {
              code: 'TICKET_NOT_INSIDE',
              message: 'Tiket belum check-in masuk (tidak bisa check-out)',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        // Sukses Check-out: Update status tiket ke VALID & Buat ScanLog
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: TicketStatus.VALID,
            checkedOutAt: new Date(),
            checkedOutBy: staffUserId,
          },
        });

        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'CHECK_OUT',
          },
        });

        return {
          success: true,
          message:
            'Check-out berhasil! Tiket dinonaktifkan sementara (bisa masuk kembali).',
          ticketId: ticket.id,
          buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      if (ticket.status === TicketStatus.TRANSFER_PENDING) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'TRANSFER_PENDING',
          },
        });
        throw new HttpException(
          {
            code: 'QR_INVALID',
            message:
              'Tiket sedang dalam proses transfer kepemilikan. QR lama ini tidak dapat digunakan untuk check-in.',
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (ticket.status !== TicketStatus.VALID && ticket.status !== TicketStatus.CHECKED_IN) {
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

      // Evaluasi Kategori: Perorangan vs Berpasangan (Couple/Package)
      const category = ticket.orderItem.ticketCategory;
      const ticketPerPackage = Number(category?.ticketPerPackage) || 1;
      const isCategoryCouple =
        ticketPerPackage === 2 ||
        /couple|pasangan|berdua|duet|paket\s*2/i.test(category?.name || '');

      // Periksa apakah item pesanan memiliki beberapa tiket terpisah (barcode mandiri per peserta)
      const siblingTickets = await tx.ticket.findMany({
        where: { orderItemId: ticket.orderItemId },
        select: { id: true, attendeeName: true },
      });
      const hasSeparateBarcodes = siblingTickets.length > 1;

      // Hitung total scan VALID yang pernah dilakukan pada tiket ini
      const validScanCount = await tx.scanLog.count({
        where: {
          ticketId: ticket.id,
          result: 'VALID',
        },
      });

      // Kasus 1: Tiket memiliki Barcode Mandiri per Peserta (Setiap barcode strictly untuk 1 orang)
      if (hasSeparateBarcodes) {
        if (ticket.status === TicketStatus.CHECKED_IN || validScanCount >= 1) {
          await tx.scanLog.create({
            data: {
              ticketId: ticket.id,
              scannedById: staffUserId,
              result: 'DUPLICATE',
            },
          });

          const msg = isCategoryCouple
            ? `Tiket untuk ${ticket.attendeeName || 'peserta ini'} sudah pernah check-in sebelumnya. Pasangan Anda wajib menggunakan barcode kedua miliknya sendiri.`
            : 'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket untuk 1 orang).';

          throw new HttpException(
            {
              code: 'QR_ALREADY_USED',
              message: msg,
            },
            HttpStatus.CONFLICT,
          );
        }

        const updatedTicket = await tx.ticket.update({
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
          message: isCategoryCouple
            ? 'Check-in berhasil! Tiket Berpasangan (Barcode Mandiri Peserta).'
            : 'Check-in berhasil! Selamat menikmati acara (Tiket Perorangan: 1 orang).',
          ticketId: ticket.id,
          buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          isCouple: isCategoryCouple,
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      // Kasus 2: Tiket Berpasangan dengan 1 Barcode Bersama (1 barcode berlaku untuk 2 orang)
      if (isCategoryCouple) {
        const maxAllowedPax = ticketPerPackage > 1 ? ticketPerPackage : 2;

        if (validScanCount >= maxAllowedPax || ticket.status === TicketStatus.CHECKED_IN) {
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
              message: `Tiket berpasangan ini sudah memenuhi kuota maksimal (${maxAllowedPax} dari ${maxAllowedPax} orang sudah check-in).`,
            },
            HttpStatus.CONFLICT,
          );
        }

        const isLastPax = validScanCount + 1 >= maxAllowedPax;
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: isLastPax ? TicketStatus.CHECKED_IN : TicketStatus.VALID,
            checkedInAt: ticket.checkedInAt || new Date(),
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

        const successMsg = isLastPax
          ? `Check-in berhasil! Tiket Berpasangan lengkap (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk).`
          : `Check-in berhasil! Tiket Berpasangan (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk). Barcode masih dapat digunakan untuk 1 orang pasangannya.`;

        return {
          success: true,
          message: successMsg,
          ticketId: ticket.id,
          buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          isCouple: true,
          remainingPax: maxAllowedPax - (validScanCount + 1),
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      // Kasus 3: Tiket Perorangan Standar (Locking Ketat: 1 Tiket Hanya untuk 1 Orang)
      if (ticket.status === TicketStatus.CHECKED_IN || validScanCount >= 1) {
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
            message:
              'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket hanya berlaku untuk 1 orang).',
          },
          HttpStatus.CONFLICT,
        );
      }

      // Sukses Check-in Perorangan: Kunci status ke CHECKED_IN
      const updatedTicket = await tx.ticket.update({
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
        message: 'Check-in berhasil! Selamat menikmati acara (Tiket Perorangan: 1 orang).',
        ticketId: ticket.id,
        buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
        ticketCategory: ticket.orderItem.ticketCategory.name,
        eventTitle: ticket.orderItem.ticketCategory.name,
        isCouple: false,
        ticket: {
          id: ticket.id,
          status: updatedTicket.status,
          checkedInAt: updatedTicket.checkedInAt,
          checkedOutAt: updatedTicket.checkedOutAt,
          orderItem: {
            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
            ticketCategory: {
              name: ticket.orderItem.ticketCategory.name,
            },
          },
        },
      };
    });
  }

  /**
   * Validasi tiket secara manual dengan mengetik kode tiket / UUID tiket.
   */
  async manualCheckin(dto: ManualCheckinDto, staffUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Cari berdasarkan ID (UUID) atau jika qrPayload sama persis
      const preliminary = await tx.ticket.findFirst({
        where: {
          OR: [{ id: dto.code }, { qrPayload: dto.code }],
        },
        select: { id: true },
      });

      if (!preliminary) {
        throw new NotFoundException('Tiket tidak terdaftar di sistem');
      }

      // 1. Pessimistic Row Lock (SELECT ... FOR UPDATE)
      if (typeof tx.$queryRaw === 'function') {
        try {
          await tx.$queryRaw`
            SELECT id FROM "Ticket"
            WHERE id = ${preliminary.id}
            FOR UPDATE
          `;
        } catch (lockErr) {
          // Abaikan jika mock test
        }
      }

      const ticket = await tx.ticket.findUnique({
        where: { id: preliminary.id },
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

      if (ticket.isBlocked) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'BLOCKED',
          },
        });
        throw new HttpException(
          {
            code: 'TICKET_BLOCKED',
            message:
              ticket.blockedReason ||
              'Tiket telah dinonaktifkan / diblokir oleh panitia',
          },
          HttpStatus.FORBIDDEN,
        );
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
      const isOut = dto.action === 'out';

      if (isOut) {
        if (ticket.status !== TicketStatus.CHECKED_IN) {
          await tx.scanLog.create({
            data: {
              ticketId: ticket.id,
              scannedById: staffUserId,
              result: 'INVALID_OUT',
            },
          });
          throw new BadRequestException(
            'Tiket belum check-in masuk (tidak bisa check-out)',
          );
        }

        // Update status & buat ScanLog
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: TicketStatus.VALID,
            checkedOutAt: new Date(),
            checkedOutBy: staffUserId,
          },
        });

        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'CHECK_OUT',
          },
        });

        return {
          success: true,
          message: 'Check-out manual berhasil!',
          ticketId: ticket.id,
          buyerName: ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      if (ticket.status !== TicketStatus.VALID && ticket.status !== TicketStatus.CHECKED_IN) {
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

      // Evaluasi Kategori: Perorangan vs Berpasangan
      const category = ticket.orderItem.ticketCategory;
      const ticketPerPackage = Number(category?.ticketPerPackage) || 1;
      const isCategoryCouple =
        ticketPerPackage === 2 ||
        /couple|pasangan|berdua|duet|paket\s*2/i.test(category?.name || '');

      const siblingTickets = await tx.ticket.findMany({
        where: { orderItemId: ticket.orderItemId },
        select: { id: true, attendeeName: true },
      });
      const hasSeparateBarcodes = siblingTickets.length > 1;

      const validScanCount = await tx.scanLog.count({
        where: {
          ticketId: ticket.id,
          result: 'VALID',
        },
      });

      // Kasus 1: Tiket memiliki Barcode Mandiri per Peserta
      if (hasSeparateBarcodes) {
        if (ticket.status === TicketStatus.CHECKED_IN || validScanCount >= 1) {
          await tx.scanLog.create({
            data: {
              ticketId: ticket.id,
              scannedById: staffUserId,
              result: 'DUPLICATE',
            },
          });
          const msg = isCategoryCouple
            ? `Tiket manual untuk ${ticket.attendeeName || 'peserta ini'} sudah pernah check-in. Pasangan Anda wajib menggunakan kode/barcode miliknya sendiri.`
            : 'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket untuk 1 orang).';
          throw new BadRequestException(msg);
        }

        const updatedTicket = await tx.ticket.update({
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
          message: isCategoryCouple
            ? 'Check-in manual berhasil! Tiket Berpasangan (Kode Peserta).'
            : 'Check-in manual berhasil! (Tiket Perorangan: 1 orang).',
          ticketId: ticket.id,
          buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          isCouple: isCategoryCouple,
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      // Kasus 2: Tiket Berpasangan dengan 1 Barcode/Kode Bersama (Maks 2 orang)
      if (isCategoryCouple) {
        const maxAllowedPax = ticketPerPackage > 1 ? ticketPerPackage : 2;

        if (validScanCount >= maxAllowedPax || ticket.status === TicketStatus.CHECKED_IN) {
          await tx.scanLog.create({
            data: {
              ticketId: ticket.id,
              scannedById: staffUserId,
              result: 'DUPLICATE',
            },
          });
          throw new BadRequestException(
            `Tiket berpasangan ini sudah memenuhi kuota maksimal (${maxAllowedPax} dari ${maxAllowedPax} orang sudah check-in).`,
          );
        }

        const isLastPax = validScanCount + 1 >= maxAllowedPax;
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: isLastPax ? TicketStatus.CHECKED_IN : TicketStatus.VALID,
            checkedInAt: ticket.checkedInAt || new Date(),
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

        const successMsg = isLastPax
          ? `Check-in manual berhasil! Tiket Berpasangan lengkap (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk).`
          : `Check-in manual berhasil! Tiket Berpasangan (${validScanCount + 1} dari ${maxAllowedPax} orang telah masuk). Kode masih berlaku untuk 1 orang pasangannya.`;

        return {
          success: true,
          message: successMsg,
          ticketId: ticket.id,
          buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
          ticketCategory: ticket.orderItem.ticketCategory.name,
          eventTitle: ticket.orderItem.ticketCategory.name,
          isCouple: true,
          remainingPax: maxAllowedPax - (validScanCount + 1),
          ticket: {
            id: ticket.id,
            status: updatedTicket.status,
            checkedInAt: updatedTicket.checkedInAt,
            checkedOutAt: updatedTicket.checkedOutAt,
            orderItem: {
              attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
              ticketCategory: {
                name: ticket.orderItem.ticketCategory.name,
              },
            },
          },
        };
      }

      // Kasus 3: Tiket Perorangan Standar (1 Tiket Hanya untuk 1 Orang)
      if (ticket.status === TicketStatus.CHECKED_IN || validScanCount >= 1) {
        await tx.scanLog.create({
          data: {
            ticketId: ticket.id,
            scannedById: staffUserId,
            result: 'DUPLICATE',
          },
        });
        throw new BadRequestException(
          'Tiket perorangan ini sudah pernah digunakan untuk check-in sebelumnya (1 tiket hanya berlaku untuk 1 orang).',
        );
      }

      // Update status & buat ScanLog
      const updatedTicket = await tx.ticket.update({
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
        message: 'Check-in manual berhasil! (Tiket Perorangan: 1 orang).',
        ticketId: ticket.id,
        buyerName: ticket.attendeeName || ticket.orderItem.attendeeName,
        ticketCategory: ticket.orderItem.ticketCategory.name,
        eventTitle: ticket.orderItem.ticketCategory.name,
        isCouple: false,
        ticket: {
          id: ticket.id,
          status: updatedTicket.status,
          checkedInAt: updatedTicket.checkedInAt,
          checkedOutAt: updatedTicket.checkedOutAt,
          orderItem: {
            attendeeName: ticket.attendeeName || ticket.orderItem.attendeeName,
            ticketCategory: {
              name: ticket.orderItem.ticketCategory.name,
            },
          },
        },
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
