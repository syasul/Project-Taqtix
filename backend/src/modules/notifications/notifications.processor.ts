import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';

interface NotificationPayload {
  ticketId: string;
  buyerName: string;
  eventTitle: string;
  ticketCategory: string;
  qrUrl: string;
  phone?: string;
  email?: string;
}

@Processor('notifications')
export class NotificationsProcessor {
  /**
   * Menangani pengiriman e-ticket via WhatsApp (Mock).
   */
  @Process('send-ticket-whatsapp')
  async handleSendTicketWhatsapp(job: Job<NotificationPayload>) {
    const { phone, buyerName, eventTitle, ticketCategory, qrUrl } = job.data;

    console.log(
      `[BullMQ Processor] Memulai pengiriman WhatsApp ke ${phone}...`,
    );
    // Simulasi delay pengiriman network
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

  /**
   * Menangani pengiriman e-ticket via Email (Mock).
   */
  @Process('send-ticket-email')
  async handleSendTicketEmail(job: Job<NotificationPayload>) {
    const { email, buyerName, eventTitle, ticketCategory, qrUrl } = job.data;

    console.log(`[BullMQ Processor] Memulai pengiriman Email ke ${email}...`);
    // Simulasi delay pengiriman network
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
}
