import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportResult {
  isAsync: boolean;
  filename: string;
  csv: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getExportsDirectory(): string {
    const baseUploadDir =
      this.configService.get<string>('UPLOAD_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads');
    const exportsDir = path.join(baseUploadDir, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    return exportsDir;
  }

  private handleCsvResult(filename: string, csv: string, rowCount: number): ExportResult {
    // Jika data lebih dari 1000 baris, simpan sebagai file lokal terisolasi untuk background polling
    if (rowCount > 1000) {
      const exportDir = this.getExportsDirectory();
      const filePath = path.join(exportDir, filename);
      fs.writeFileSync(filePath, csv, 'utf-8');

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam expiry
      return {
        isAsync: true,
        filename,
        csv,
        downloadUrl: `/uploads/exports/${filename}`,
        expiresAt,
      };
    }

    // Untuk data <= 1000 baris, return langsung sinkron
    return {
      isAsync: false,
      filename,
      csv,
    };
  }

  /**
   * Scheduled job pembersih (jalan tiap 1 jam)
   * Menghapus file export yang sudah kedaluwarsa (> 24 jam)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredExports() {
    try {
      const exportDir = this.getExportsDirectory();
      if (!fs.existsSync(exportDir)) return;

      const files = fs.readdirSync(exportDir);
      const now = Date.now();
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 jam

      for (const file of files) {
        const filePath = path.join(exportDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // Abaikan error file tunggal
        }
      }
    } catch (err) {
      console.error('[ExportsCleaner] Gagal membersihkan file ekspor lama:', err);
    }
  }

  private async getOrganizerOrThrow(userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
      include: { organizer: true },
    });
    if (member?.organizer) return member.organizer;

    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (!organizer) {
      throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
    }
    return organizer;
  }

  private async verifyEventOwnership(eventId: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.organizerId !== organizer.id) {
      throw new NotFoundException('Event tidak ditemukan atau bukan milik Anda');
    }
    return { event, organizer };
  }

  /**
   * Export daftar semua pesanan event dalam CSV.
   */
  async exportOrders(eventId: string, userId: string): Promise<ExportResult> {
    await this.verifyEventOwnership(eventId, userId);

    const orders = await this.prisma.order.findMany({
      where: { eventId },
      include: {
        buyer: true,
        orderItems: {
          include: {
            ticketCategory: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const customFields = await this.prisma.customFormField.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    const headers = [
      'OrderID',
      'BuyerEmail',
      'Status',
      'TotalAmount',
      'DiscountAmount',
      'TicketCategory',
      'Qty',
      'AttendeeName',
      'AttendeePhone',
      'City',
      'PaymentMethod',
      ...customFields.map((f) => `"${f.label.replace(/"/g, '""')}"`),
      'CreatedAt',
    ];

    const rows: string[] = [];
    for (const ord of orders) {
      for (const item of ord.orderItems) {
        const customAnswers =
          (item.customFieldAnswers as Record<string, any>) || {};
        const customValues = customFields.map((f) => {
          const val = customAnswers[f.id] ?? customAnswers[f.label] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });

        rows.push(
          [
            `"${ord.id}"`,
            `"${ord.buyer.email}"`,
            `"${ord.status}"`,
            ord.totalAmount,
            ord.discountAmount,
            `"${item.ticketCategory?.name || ''}"`,
            item.qty,
            `"${(item.attendeeName || '').replace(/"/g, '""')}"`,
            `"${(item.attendeePhone || '').replace(/"/g, '""')}"`,
            `"${(item.city || '').replace(/"/g, '""')}"`,
            `"${ord.payment?.provider || ''}"`,
            ...customValues,
            `"${ord.createdAt.toISOString()}"`,
          ].join(','),
        );
      }
    }

    const csv = [headers.join(','), ...rows].join('\n');
    return this.handleCsvResult(
      `orders-export-${eventId}-${Date.now()}.csv`,
      csv,
      rows.length,
    );
  }

  /**
   * Export data kehadiran / attendance tiket event dalam CSV.
   */
  async exportAttendance(eventId: string, userId: string): Promise<ExportResult> {
    await this.verifyEventOwnership(eventId, userId);

    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
        staff: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = [
      'TicketID',
      'AttendeeName',
      'AttendeeEmail',
      'AttendeePhone',
      'Category',
      'Status',
      'CheckedInAt',
      'StaffEmail',
      'WristbandCode',
      'IsBlocked',
    ];

    const rows = tickets.map((t) => [
      `"${t.id}"`,
      `"${(t.orderItem.attendeeName || '').replace(/"/g, '""')}"`,
      `"${(t.orderItem.attendeeEmail || '').replace(/"/g, '""')}"`,
      `"${(t.orderItem.attendeePhone || '').replace(/"/g, '""')}"`,
      `"${(t.orderItem.ticketCategory?.name || '').replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.checkedInAt ? t.checkedInAt.toISOString() : ''}"`,
      `"${t.staff?.email || ''}"`,
      `"${t.wristbandCode || ''}"`,
      t.isBlocked ? 'YES' : 'NO',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return this.handleCsvResult(
      `attendance-export-${eventId}-${Date.now()}.csv`,
      csv,
      rows.length,
    );
  }

  /**
   * Export ringkasan keuangan event (revenue, fees, net) dalam CSV.
   */
  async exportFinancialSummary(eventId: string, userId: string): Promise<ExportResult> {
    const { event } = await this.verifyEventOwnership(eventId, userId);

    const orders = await this.prisma.order.findMany({
      where: { eventId, status: 'PAID' },
    });

    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalDiscount = orders.reduce((acc, o) => acc + o.discountAmount, 0);

    const cashTxs = await this.prisma.cashTransaction.findMany({
      where: { eventId },
    });
    const totalCashIn = cashTxs.reduce((acc, c) => acc + c.amount, 0);

    const headers = [
      'EventTitle',
      'TotalOrdersPaid',
      'OnlineRevenue',
      'TotalDiscount',
      'CashInTotal',
      'GrossSales',
    ];
    const row = [
      `"${event.title.replace(/"/g, '""')}"`,
      orders.length,
      totalRevenue,
      totalDiscount,
      totalCashIn,
      totalRevenue + totalCashIn,
    ];

    const csv = [headers.join(','), row.join(',')].join('\n');
    return this.handleCsvResult(
      `financial-summary-${eventId}-${Date.now()}.csv`,
      csv,
      1,
    );
  }

  /**
   * Export ringkasan lintas semua event milik organizer dalam CSV.
   */
  async exportCrossEventSummary(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<ExportResult> {
    const organizer = await this.getOrganizerOrThrow(userId);

    const where: any = { organizerId: organizer.id };
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to) where.startDate.lte = new Date(to);
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        orders: { where: { status: 'PAID' } },
        tickets: true,
        cashTransactions: true,
      },
      orderBy: { startDate: 'desc' },
    });

    const headers = [
      'EventID',
      'EventTitle',
      'Status',
      'StartDate',
      'PaidOrdersCount',
      'TicketsSold',
      'TicketsCheckedIn',
      'OnlineRevenue',
      'CashRevenue',
      'TotalRevenue',
    ];

    const rows = events.map((ev) => {
      const onlineRev = ev.orders.reduce((acc, o) => acc + o.totalAmount, 0);
      const cashRev = ev.cashTransactions.reduce((acc, c) => acc + c.amount, 0);
      const checkedIn = ev.tickets.filter((t) => t.status === 'CHECKED_IN').length;

      return [
        `"${ev.id}"`,
        `"${ev.title.replace(/"/g, '""')}"`,
        `"${ev.status}"`,
        `"${ev.startDate.toISOString()}"`,
        ev.orders.length,
        ev.tickets.length,
        checkedIn,
        onlineRev,
        cashRev,
        onlineRev + cashRev,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    return this.handleCsvResult(
      `cross-event-summary-${organizer.id}-${Date.now()}.csv`,
      csv,
      rows.length,
    );
  }
}
