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
        }
        catch (err) {
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
};
exports.CRMProcessor = CRMProcessor;
__decorate([
    (0, bull_1.Process)('send-whatsapp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], CRMProcessor.prototype, "handleSendWhatsapp", null);
exports.CRMProcessor = CRMProcessor = __decorate([
    (0, bull_1.Processor)('broadcast'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CRMProcessor);
//# sourceMappingURL=crm.processor.js.map