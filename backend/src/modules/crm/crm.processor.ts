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
      await this.updateMasterJobCounter(recipient.jobId, true);
    } catch (err: any) {
      console.error(`Gagal mengirim WhatsApp broadcast ke ${recipient.phone}:`, err);

      await this.prisma.broadcastRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'failed',
          error: err.message || 'Unknown error',
        },
      });

      await this.updateMasterJobCounter(recipient.jobId, false);
    }
  }

  @Process('send-email')
  async handleSendEmail(
    job: Job<{ recipientId: string; message: string; subject?: string }>,
  ) {
    const { recipientId, message, subject } = job.data;

    const recipient = await this.prisma.broadcastRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return;
    }

    try {
      // 1. Personalisasi pesan dengan placeholder {name}
      const personalizedMessage = message.replace(/{name}/g, recipient.name);
      const emailSubject = subject || 'Informasi Penting Acara Anda';

      // 2. Template HTML email dasar
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
            .header { border-bottom: 2px solid #08ADAE; padding-bottom: 16px; margin-bottom: 20px; }
            .title { color: #06202A; font-size: 20px; font-weight: 700; margin: 0; }
            .content { color: #334155; line-height: 1.6; font-size: 15px; white-space: pre-line; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1 class="title">TAQtix Notification</h1>
            </div>
            <div class="content">
              ${personalizedMessage}
            </div>
            <div class="footer">
              Email ini dikirimkan secara resmi melalui sistem tiket TAQtix.
            </div>
          </div>
        </body>
        </html>
      `;

      console.log(`[EMAIL BROADCAST] Mengirim ke: ${recipient.email} | Subjek: ${emailSubject}`);

      // Simulasi delay pengiriman network email
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Tandai sukses pengiriman
      await this.prisma.broadcastRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // 4. Update status counter pada master job
      await this.updateMasterJobCounter(recipient.jobId, true);
    } catch (err: any) {
      console.error(`Gagal mengirim Email broadcast ke ${recipient.email}:`, err);

      await this.prisma.broadcastRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'failed',
          error: err.message || 'Unknown error',
        },
      });

      await this.updateMasterJobCounter(recipient.jobId, false);
    }
  }

  /**
   * Helper untuk mengupdate counter sent/failed pada master job
   */
  private async updateMasterJobCounter(jobId: string, isSuccess: boolean) {
    const masterJob = await this.prisma.broadcastJob.findUnique({
      where: { id: jobId },
    });

    if (!masterJob) return;

    const nextSent = isSuccess ? masterJob.sentCount + 1 : masterJob.sentCount;
    const nextFailed = !isSuccess ? masterJob.failedCount + 1 : masterJob.failedCount;
    const totalProcessed = nextSent + nextFailed;
    const isCompleted = totalProcessed >= masterJob.targetCount;

    await this.prisma.broadcastJob.update({
      where: { id: masterJob.id },
      data: {
        sentCount: nextSent,
        failedCount: nextFailed,
        status: isCompleted ? 'completed' : 'processing',
      },
    });
  }
}
