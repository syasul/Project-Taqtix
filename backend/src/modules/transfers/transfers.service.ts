import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
  async requestTransfer(ticketId: string, dto: RequestTransferDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        orderItem: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    if (!ticket.event.allowTicketTransfer) {
      throw new ForbiddenException('Fitur transfer tiket dinonaktifkan oleh penyelenggara untuk event ini.');
    }

    if (ticket.status !== 'VALID') {
      throw new BadRequestException('Hanya tiket dengan status VALID yang dapat ditransfer.');
    }

    if (ticket.isBlocked) {
      throw new ForbiddenException('Tiket telah diblokir dan tidak dapat ditransfer.');
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
      throw new BadRequestException('Tiket ini sedang dalam proses transfer yang belum selesai.');
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

      return tx.ticketTransfer.create({
        data: {
          ticketId,
          fromEmail: ticket.orderItem.attendeeEmail,
          toName: dto.toName,
          toEmail: dto.toEmail,
          toPhone: dto.toPhone,
          requestToken,
          expiresAt,
          status: 'pending',
        },
      });
    });
  }

  /**
   * Konfirmasi penerimaan transfer tiket oleh penerima.
   */
  async confirmTransfer(requestToken: string) {
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
      throw new BadRequestException(`Transfer sudah berstatus ${transfer.status}`);
    }

    if (new Date() > transfer.expiresAt) {
      await this.prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Permintaan transfer sudah kedaluwarsa');
    }

    // Generate QR baru untuk tiket yang sah
    const newQrPayload = await this.generateQrPayload(
      transfer.ticket.id,
      transfer.ticket.eventId,
    );

    return this.prisma.$transaction(async (tx) => {
      // Update ticket QR & status
      const updatedTicket = await tx.ticket.update({
        where: { id: transfer.ticket.id },
        data: {
          qrPayload: newQrPayload,
          status: 'VALID',
        },
      });

      // Update attendee profile di orderItem
      await tx.orderItem.update({
        where: { id: transfer.ticket.orderItemId },
        data: {
          attendeeName: transfer.toName,
          attendeeEmail: transfer.toEmail,
          attendeePhone: transfer.toPhone,
        },
      });

      // Update transfer status
      const completedTransfer = await tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Transfer tiket berhasil diselesaikan',
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
      throw new BadRequestException(`Transfer sudah berstatus ${transfer.status}`);
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
  async handleExpiredTransfers() {
    const expiredTransfers = await this.prisma.ticketTransfer.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      include: { ticket: true },
    });

    for (const t of expiredTransfers) {
      const restoredQr = await this.generateQrPayload(t.ticket.id, t.ticket.eventId);
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
