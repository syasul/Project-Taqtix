import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('broadcast')
export class CRMProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('send-whatsapp')
  async handleSendWhatsapp(job: Job<{ recipientId: string; message: string }>) {
    const { recipientId, message } = job.data;

    const recipient = await this.prisma.broadcastRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return;
    }

    try {
      // 1. Ganti placeholder {name}
      const personalizedMessage = message.replace(/{name}/g, recipient.name);

      // 2. Simulasi pengiriman via WhatsApp provider API
      console.log(`[WHATSAPP BROADCAST] Kirim ke: ${recipient.phone}`);
      console.log(`Pesan: "${personalizedMessage}"`);

      // Simulasi delay sedikit untuk memposisikan pengiriman
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 3. Tandai sukses
      await this.prisma.broadcastRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // 4. Update status counter pada master job
      const masterJob = await this.prisma.broadcastJob.findUnique({
        where: { id: recipient.jobId },
      });

      if (masterJob) {
        const nextSent = masterJob.sentCount + 1;
        const totalProcessed = nextSent + masterJob.failedCount;
        const isCompleted = totalProcessed >= masterJob.targetCount;

        await this.prisma.broadcastJob.update({
          where: { id: masterJob.id },
          data: {
            sentCount: nextSent,
            status: isCompleted ? 'completed' : 'processing',
          },
        });
      }
    } catch (err: any) {
      console.error(`Gagal mengirim broadcast ke ${recipient.phone}:`, err);

      await this.prisma.broadcastRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'failed',
          error: err.message || 'Unknown error',
        },
      });

      const masterJob = await this.prisma.broadcastJob.findUnique({
        where: { id: recipient.jobId },
      });

      if (masterJob) {
        const nextFailed = masterJob.failedCount + 1;
        const totalProcessed = masterJob.sentCount + nextFailed;
        const isCompleted = totalProcessed >= masterJob.targetCount;

        await this.prisma.broadcastJob.update({
          where: { id: masterJob.id },
          data: {
            failedCount: nextFailed,
            status: isCompleted ? 'completed' : 'processing',
          },
        });
      }
    }
  }
}
