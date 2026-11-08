import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RequestTransferDto } from './dto/request-transfer.dto';
import * as crypto from 'crypto';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateQrPayload(ticketId: string, eventId: string) {
    const qrSecret =
      this.configService.get<string>('QR_SIGNING_SECRET') ||
      this.configService.get<string>('QR_SECRET') ||
      'super-secret-qr-key-change-me';

    return this.jwtService.signAsync(
      {
        ticketId,
        eventId,
        type: 'audience',
        nonce: crypto.randomBytes(8).toString('hex'),
      },
      { secret: qrSecret },
    );
  }

  /**
   * Request transfer kepemilikan tiket ke penerima baru.
   */
  async requestTransfer(
    ticketId: string,
    dto: RequestTransferDto,
    authUser?: { id: string; email: string },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        orderItem: {
          include: {
            order: {
              include: {
                buyer: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    if (!ticket.event.allowTicketTransfer) {
      throw new ForbiddenException(
        'Fitur transfer tiket dinonaktifkan oleh penyelenggara untuk event ini.',
      );
    }

    if (ticket.status !== 'VALID') {
      throw new BadRequestException(
        'Hanya tiket dengan status VALID yang dapat ditransfer.',
      );
    }

    if (ticket.isBlocked) {
      throw new ForbiddenException(
        'Tiket telah diblokir dan tidak dapat ditransfer.',
      );
    }

    if (ticket.checkedInAt) {
      throw new BadRequestException(
        'Tiket sudah digunakan untuk check-in dan tidak dapat ditransfer.',
      );
    }

    // Verifikasi kepemilikan akun jika user terotentikasi
    if (authUser) {
      const isOwner =
        (ticket.ownerId && ticket.ownerId === authUser.id) ||
        ticket.orderItem.order?.buyerId === authUser.id ||
        ticket.orderItem.attendeeEmail.toLowerCase() === authUser.email.toLowerCase() ||
        ticket.orderItem.order?.buyer?.email.toLowerCase() === authUser.email.toLowerCase();

      if (!isOwner) {
        throw new ForbiddenException(
          'Anda bukan pemilik sah dari tiket ini sehingga tidak dapat melakukan transfer.',
        );
      }
    }

    // Validasi email penerima tidak boleh sama dengan email pemilik saat ini
    const currentOwnerEmail = ticket.orderItem.attendeeEmail.toLowerCase();
    if (
      dto.toEmail.trim().toLowerCase() === currentOwnerEmail ||
      (authUser && dto.toEmail.trim().toLowerCase() === authUser.email.toLowerCase())
    ) {
      throw new BadRequestException(
        'Email penerima tidak boleh sama dengan email pemilik tiket saat ini.',
      );
    }

    // Periksa apakah ada transfer pending yang masih aktif
    const existingPending = await this.prisma.ticketTransfer.findFirst({
      where: {
        ticketId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'Tiket ini sedang dalam proses transfer yang belum selesai.',
      );
    }

    const requestToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    // Segera invalidasi QR lama agar tidak ada race condition saat scan
    const invalidatedQr = `TRANSFER_PENDING_${crypto.randomBytes(16).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          qrPayload: invalidatedQr,
          status: 'TRANSFER_PENDING' as any,
        },
      });

      const transfer = await tx.ticketTransfer.create({
        data: {
          ticketId,
          fromEmail: ticket.orderItem.attendeeEmail,
          fromUserId: authUser?.id || ticket.ownerId || ticket.orderItem.order?.buyerId || null,
          toName: dto.toName.trim(),
          toEmail: dto.toEmail.trim().toLowerCase(),
          toPhone: dto.toPhone.trim(),
          requestToken,
          expiresAt,
          status: 'pending',
        },
      });

      return {
        success: true,
        message: 'Permintaan transfer tiket berhasil dibuat.',
        transfer,
        requestToken,
      };
    });
  }

  /**
   * Mendapatkan ringkasan informasi transfer tiket untuk halaman klaim (Public).
   */
  async getTransferDetails(requestToken: string) {
    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { requestToken },
      include: {
        ticket: {
          include: {
            event: {
              include: {
                organizer: {
                  select: { name: true },
                },
              },
            },
            orderItem: {
              include: {
                ticketCategory: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Permintaan transfer tidak ditemukan');
    }

    const isExpired = new Date() > transfer.expiresAt;
    const effectiveStatus =
      transfer.status === 'pending' && isExpired ? 'expired' : transfer.status;

    return {
      id: transfer.id,
      requestToken: transfer.requestToken,
      status: effectiveStatus,
      expiresAt: transfer.expiresAt,
      fromEmailMasked: transfer.fromEmail.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*'),
      toName: transfer.toName,
      toEmail: transfer.toEmail,
      toPhone: transfer.toPhone,
      fromUserId: transfer.fromUserId,
      event: {
        id: transfer.ticket.event.id,
        title: transfer.ticket.event.title,
        bannerUrl: transfer.ticket.event.bannerUrl,
        location: transfer.ticket.event.location,
        startDate: transfer.ticket.event.startDate,
        endDate: transfer.ticket.event.endDate,
        isDateTba: transfer.ticket.event.isDateTba,
        organizerName: transfer.ticket.event.organizer.name,
      },
      ticketCategory: {
        id: transfer.ticket.orderItem.ticketCategory.id,
        name: transfer.ticket.orderItem.ticketCategory.name,
        price: transfer.ticket.orderItem.ticketCategory.price,
      },
      ticketId: transfer.ticket.id,
      transferCount: transfer.ticket.transferCount,
    };
  }

  /**
   * Konfirmasi penerimaan transfer tiket oleh penerima (Wajib Login).
   */
  async confirmTransfer(
    requestToken: string,
    receiverUser?: { id: string; email: string; name?: string },
  ) {
    if (!receiverUser || !receiverUser.id) {
      throw new UnauthorizedException(
        'Anda wajib masuk (login) ke akun TAQtix terlebih dahulu untuk mengklaim dan menyimpan e-tiket ini.',
      );
    }

    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { requestToken },
      include: {
        ticket: {
          include: {
            orderItem: true,
            event: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Permintaan transfer tidak ditemukan');
    }

    if (transfer.status !== 'pending') {
      throw new BadRequestException(
        `Transfer sudah tidak aktif (status: ${transfer.status})`,
      );
    }

    if (new Date() > transfer.expiresAt) {
      await this.prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Permintaan transfer sudah kedaluwarsa');
    }

    if (transfer.fromUserId && transfer.fromUserId === receiverUser.id) {
      throw new BadRequestException(
        'Anda tidak dapat mentransfer tiket ke akun Anda sendiri.',
      );
    }

    if (
      transfer.fromEmail &&
      transfer.fromEmail.toLowerCase() === receiverUser.email.toLowerCase()
    ) {
      throw new BadRequestException(
        'Akun penerima tidak boleh sama dengan akun pemilik tiket.',
      );
    }

    if (transfer.ticket.checkedInAt) {
      throw new BadRequestException(
        'Tiket sudah digunakan untuk check-in dan tidak dapat ditransfer.',
      );
    }

    // Generate QR baru kriptografis untuk tiket yang sah
    const newQrPayload = await this.generateQrPayload(
      transfer.ticket.id,
      transfer.ticket.eventId,
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Update ticket: QR baru, status VALID, terikat ke ownerId penerima, transferCount bertambah
      const updatedTicket = await tx.ticket.update({
        where: { id: transfer.ticket.id },
        data: {
          qrPayload: newQrPayload,
          status: 'VALID',
          ownerId: receiverUser.id,
          attendeeName: transfer.toName || receiverUser.name || 'Pengunjung',
          transferredAt: new Date(),
          transferCount: { increment: 1 },
        },
      });

      // 2. Update attendee profile di orderItem
      await tx.orderItem.update({
        where: { id: transfer.ticket.orderItemId },
        data: {
          attendeeName: transfer.toName || receiverUser.name || 'Pengunjung',
          attendeeEmail: receiverUser.email,
          attendeePhone: transfer.toPhone,
        },
      });

      // 3. Update transfer status menjadi completed beserta toUserId
      const completedTransfer = await tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'completed',
          toUserId: receiverUser.id,
          toEmail: receiverUser.email,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Transfer tiket berhasil diselesaikan! E-tiket baru telah diterbitkan ke akun Anda.',
        transfer: completedTransfer,
        ticket: updatedTicket,
      };
    });
  }

  /**
   * Menolak / membatalkan permintaan transfer.
   */
  async declineTransfer(requestToken: string) {
    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { requestToken },
      include: { ticket: true },
    });

    if (!transfer) {
      throw new NotFoundException('Permintaan transfer tidak ditemukan');
    }

    if (transfer.status !== 'pending') {
      throw new BadRequestException(
        `Transfer sudah berstatus ${transfer.status}`,
      );
    }

    // Restore QR untuk pemilik asal
    const restoredQr = await this.generateQrPayload(
      transfer.ticket.id,
      transfer.ticket.eventId,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: transfer.ticket.id },
        data: {
          qrPayload: restoredQr,
          status: 'VALID',
        },
      });

      return tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'cancelled' },
      });
    });
  }

  /**
   * Cron/Scheduled job: auto-expire transfer request > 24 jam.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredTransfers() {
    const expiredTransfers = await this.prisma.ticketTransfer.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      include: { ticket: true },
    });

    for (const t of expiredTransfers) {
      const restoredQr = await this.generateQrPayload(
        t.ticket.id,
        t.ticket.eventId,
      );
      await this.prisma.$transaction([
        this.prisma.ticket.update({
          where: { id: t.ticketId },
          data: {
            qrPayload: restoredQr,
            status: 'VALID',
          },
        }),
        this.prisma.ticketTransfer.update({
          where: { id: t.id },
          data: { status: 'expired' },
        }),
      ]);
    }

    return { processedCount: expiredTransfers.length };
  }

  /**
   * List transfer history for event organizer.
   */
  async listEventTransfers(eventId: string) {
    return this.prisma.ticketTransfer.findMany({
      where: {
        ticket: {
          eventId,
        },
      },
      include: {
        ticket: {
          include: {
            orderItem: {
              include: {
                ticketCategory: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
