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
exports.NotificationsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const bullmq_1 = require("bullmq");
let NotificationsProcessor = class NotificationsProcessor {
    async handleSendTicketWhatsapp(job) {
        const { phone, buyerName, eventTitle, ticketCategory, qrUrl } = job.data;
        console.log(`[BullMQ Processor] Memulai pengiriman WhatsApp ke ${phone}...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log(`
======================================================================
📢 [WHATSAPP BUSINESS API - MOCK SENDER]
----------------------------------------------------------------------
Penerima: ${phone}
Nama:     ${buyerName}
Event:    ${eventTitle}
Kategori: ${ticketCategory}
URL Tiket: ${qrUrl}

Pesan:
"Halo ${buyerName}, pembelian tiket Anda untuk event *${eventTitle}* 
telah berhasil dikonfirmasi! 🎉

Kategori: ${ticketCategory}
Silakan akses dan simpan e-ticket Anda melalui tautan berikut 
untuk validasi masuk di gerbang acara:
${qrUrl}

Terima kasih telah menggunakan layanan TAQtix."
======================================================================
    `);
        console.log(`[BullMQ Processor] WhatsApp berhasil dikirim ke ${phone}`);
    }
    async handleSendTicketEmail(job) {
        const { email, buyerName, eventTitle, ticketCategory, qrUrl } = job.data;
        console.log(`[BullMQ Processor] Memulai pengiriman Email ke ${email}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`
======================================================================
📧 [SMTP MAIL SERVICE - MOCK SENDER]
----------------------------------------------------------------------
Kepada:  ${email}
Subjek:  E-Ticket Resmi Anda untuk: ${eventTitle}
Nama:    ${buyerName}
Kategori: ${ticketCategory}

Isi Email:
"Yth. Bapak/Ibu ${buyerName},

Tiket resmi Anda untuk acara ${eventTitle} (Kategori: ${ticketCategory}) 
telah diterbitkan dengan sukses.

Silakan unduh atau tampilkan halaman tiket elektronik Anda di bawah ini
saat berada di gerbang check-in untuk dipindai oleh petugas kami:
👉 ${qrUrl}

Informasi Penting:
1. Jangan bagikan tautan ini atau kode QR Anda kepada pihak mana pun.
2. Kode QR hanya dapat dipindai satu kali untuk akses masuk.

Hormat kami,
Customer Service TAQtix"
======================================================================
    `);
        console.log(`[BullMQ Processor] Email berhasil dikirim ke ${email}`);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
__decorate([
    (0, bull_1.Process)('send-ticket-whatsapp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], NotificationsProcessor.prototype, "handleSendTicketWhatsapp", null);
__decorate([
    (0, bull_1.Process)('send-ticket-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_1.Job]),
    __metadata("design:returntype", Promise)
], NotificationsProcessor.prototype, "handleSendTicketEmail", null);
exports.NotificationsProcessor = NotificationsProcessor = __decorate([
    (0, bull_1.Processor)('notifications')
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map