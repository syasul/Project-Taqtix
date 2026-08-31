import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class CRMService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('broadcast') private readonly broadcastQueue: Queue,
  ) {}

  /**
   * Membuat segmen baru dengan kriteria dinamis.
   */
  async createSegment(eventId: string, name: string, criteria: any) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    return this.prisma.segment.create({
      data: {
        eventId,
        name,
        criteria,
      },
    });
  }

  /**
   * Mendapatkan daftar semua segmen untuk event.
   */
  async findSegments(eventId: string) {
    return this.prisma.segment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mendapatkan detail segmen.
   */
  async findSegment(segmentId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });
    if (!segment) {
      throw new NotFoundException('Segmen tidak ditemukan');
    }
    return segment;
  }

  /**
   * Mengambil data kontak pembeli yang masuk kriteria segmen saat ini.
   */
  async getSegmentMembers(segmentId: string) {
    const segment = await this.findSegment(segmentId);
    const criteria = segment.criteria as any;

    const where: any = {
      order: {
        eventId: segment.eventId,
        status: 'PAID',
      },
    };

    if (criteria.ticketCategoryIds && criteria.ticketCategoryIds.length > 0) {
      where.ticketCategoryId = { in: criteria.ticketCategoryIds };
    }

    if (criteria.cities && criteria.cities.length > 0) {
      where.city = { in: criteria.cities };
    }

    if (criteria.previousEventIds && criteria.previousEventIds.length > 0) {
      const prevItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            eventId: { in: criteria.previousEventIds },
            status: 'PAID',
          },
        },
        select: { attendeeEmail: true },
      });
      const prevEmails = Array.from(new Set(prevItems.map((item) => item.attendeeEmail)));
      where.attendeeEmail = { in: prevEmails };
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where,
      select: {
        attendeeName: true,
        attendeeEmail: true,
        attendeePhone: true,
        city: true,
        qty: true,
        ticketCategory: {
          select: { name: true },
        },
      },
    });

    // Deduplikasi berdasarkan email
    const buyerMap = new Map<string, any>();
    for (const item of orderItems) {
      const email = item.attendeeEmail;
      if (!buyerMap.has(email)) {
        buyerMap.set(email, {
          name: item.attendeeName,
          email: item.attendeeEmail,
          phone: item.attendeePhone,
          city: item.city || 'Unknown',
          qty: 0,
          categories: new Set<string>(),
        });
      }
      const buyer = buyerMap.get(email);
      buyer.qty += item.qty;
      buyer.categories.add(item.ticketCategory.name);
    }

    let buyers = Array.from(buyerMap.values()).map((b) => ({
      name: b.name,
      email: b.email,
      phone: b.phone,
      city: b.city,
      qty: b.qty,
      categories: Array.from(b.categories),
    }));

    if (criteria.minPurchaseCount) {
      buyers = buyers.filter((b) => b.qty >= criteria.minPurchaseCount);
    }

    return buyers;
  }

  /**
   * Mengirim broadcast pesan ke seluruh anggota segmen (di-queue via BullMQ).
   */
  async createBroadcast(
    segmentId: string,
    message: string,
    channel: 'whatsapp' | 'email' = 'whatsapp',
    subject?: string,
  ) {
    const members = await this.getSegmentMembers(segmentId);

    const job = await this.prisma.broadcastJob.create({
      data: {
        segmentId,
        message: subject ? `[${subject}]\n\n${message}` : message,
        targetCount: members.length,
        status: 'queued',
      },
    });

    if (members.length === 0) {
      await this.prisma.broadcastJob.update({
        where: { id: job.id },
        data: { status: 'completed' },
      });
      return { jobId: job.id, targetCount: 0, status: 'completed' };
    }

    const recipientsData = members.map((m) => ({
      jobId: job.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      status: 'pending',
    }));

    await this.prisma.broadcastRecipient.createMany({
      data: recipientsData,
    });

    const savedRecipients = await this.prisma.broadcastRecipient.findMany({
      where: { jobId: job.id },
    });

    const queueJobName = channel === 'email' ? 'send-email' : 'send-whatsapp';

    // Tambahkan setiap penerima ke antrean BullMQ
    for (const rec of savedRecipients) {
      await this.broadcastQueue.add(
        queueJobName,
        {
          recipientId: rec.id,
          channel,
          subject: subject || 'Pemberitahuan Event',
          message,
        },
        {
          jobId: `${job.id}_${rec.id}`,
        },
      );
    }

    await this.prisma.broadcastJob.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    return {
      jobId: job.id,
      channel,
      targetCount: members.length,
      status: 'processing',
    };
  }

  /**
   * Cek status broadcast job.
   */
  async getBroadcastStatus(jobId: string) {
    const job = await this.prisma.broadcastJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Broadcast job tidak ditemukan');
    }

    return {
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        targetCount: job.targetCount,
        sent: job.sentCount,
        failed: job.failedCount,
      },
    };
  }
}
