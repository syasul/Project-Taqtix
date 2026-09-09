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
exports.CRMProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
let CRMProcessor = class CRMProcessor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleSendWhatsapp(job) {
        const { recipientId, message } = job.data;
        const recipient = await this.prisma.broadcastRecipient.findUnique({
            where: { id: recipientId },
        });
        if (!recipient) {
            return;
        }
        try {
            const personalizedMessage = message.replace(/{name}/g, recipient.name);
            console.log(`[WHATSAPP BROADCAST] Kirim ke: ${recipient.phone}`);
            console.log(`Pesan: "${personalizedMessage}"`);
            await new Promise((resolve) => setTimeout(resolve, 200));
            await this.prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });
            await this.updateMasterJobCounter(recipient.jobId, true);
        }
        catch (err) {
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
    async handleSendEmail(job) {
        const { recipientId, message, subject } = job.data;
        const recipient = await this.prisma.broadcastRecipient.findUnique({
            where: { id: recipientId },
        });
        if (!recipient) {
            return;
        }
        try {
            const personalizedMessage = message.replace(/{name}/g, recipient.name);
            const emailSubject = subject || 'Informasi Penting Acara Anda';
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
            await new Promise((resolve) => setTimeout(resolve, 300));
            await this.prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });
            await this.updateMasterJobCounter(recipient.jobId, true);
        }
        catch (err) {
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
    async updateMasterJobCounter(jobId, isSuccess) {
        const masterJob = await this.prisma.broadcastJob.findUnique({
            where: { id: jobId },
        });
        if (!masterJob)
            return;
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
};
exports.CRMProcessor = CRMProcessor;
__decorate([
    (0, bull_1.Process)('send-whatsapp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], CRMProcessor.prototype, "handleSendWhatsapp", null);
__decorate([
    (0, bull_1.Process)('send-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], CRMProcessor.prototype, "handleSendEmail", null);
exports.CRMProcessor = CRMProcessor = __decorate([
    (0, bull_1.Processor)('broadcast'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CRMProcessor);
//# sourceMappingURL=crm.processor.js.map