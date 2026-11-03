'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Ticket, CreditCard, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Pemesanan & Tiket',
    question: 'Bagaimana cara membeli tiket event di TAQtix?',
    answer: 'Cukup pilih event unggulan di halaman Discovery, tentukan kategori tiket dan jumlah tiket yang ingin dibeli, isi data diri peserta, lalu lakukan pembayaran instan. E-Tiket Anda akan dikirim langsung via WhatsApp setelah pembayaran terkonfirmasi.',
  },
  {
    category: 'Pemesanan & Tiket',
    question: 'Apakah saya perlu mencetak e-ticket sebelum datang ke lokasi?',
    answer: 'Tidak perlu. Anda hanya cukup menunjukkan QR Code e-ticket yang dikirimkan ke WhatsApp Anda di pintu masuk event. Pastikan layar HP Anda cukup terang saat discan oleh petugas gerbang.',
  },
  {
    category: 'Pemesanan & Tiket',
    question: 'Bolehkah saya melakukan refund (pengembalian dana) atas tiket yang dibeli?',
    answer: 'Tiket yang sudah dibeli tidak dapat dibatalkan atau direfund, kecuali Jika terjadi pembatalan acara oleh penyelenggara, maka refund sepenuhnya ditanggung oleh pihak penyelenggara.',
  },
  {
    category: 'Pembayaran',
    question: 'Metode pembayaran apa saja yang didukung oleh TAQtix?',
    answer: 'TAQtix mendukung berbagai metode pembayaran instan dan otomatis melalui Payment Gateway terintegrasi, termasuk QRIS (GoPay, OVO, ShopeePay, Dana, LinkAja), Virtual Account Bank (BCA, Mandiri, BNI, BRI), serta Transfer Bank manual jika diperlukan.',
  },
  {
    category: 'Pembayaran',
    question: 'Mengapa status pesanan saya masih tertunda (pending) setelah membayar?',
    answer: 'Biasanya verifikasi pembayaran otomatis berlangsung kurang dari 1 menit. Jika dalam 10 menit status belum berubah dan WhatsApp e-ticket belum masuk, silakan hubungi tim Support kami di halaman Kontak dengan menyertakan bukti bayar.',
  },
  {
    category: 'Kemitraan & Afiliasi',
    question: 'Bagaimana cara kerja program afiliasi event?',
    answer: 'Penyelenggara event dapat mendaftarkan partner afiliasi (komunitas, sukarelawan, dll) untuk membantu membagikan link promosi unik. Setiap tiket yang dibeli melalui link tersebut akan otomatis mencatat komisi bagi partner yang bersangkutan.',
  },
  {
    category: 'Kemitraan & Afiliasi',
    question: 'Kapan komisi afiliasi saya dapat dicairkan?',
    answer: 'Komisi afiliasi terkumpul di saldo akun partner Anda dan dapat ditarik langsung ke rekening bank Anda setelah pengajuan penarikan dikonfirmasi oleh penyelenggara event, biasanya diproses dalam 1-3 hari kerja.',
  },
  {
    category: 'Scan Hari H',
    question: 'Bagaimana jika koneksi internet di lokasi event tidak stabil saat memindai tiket?',
    answer: 'TAQtix dilengkapi dengan teknologi sinkronisasi luring (offline sync) pada aplikasi mobile scanner kami. Petugas pintu gerbang tetap dapat memindai tiket pembeli secara offline dan data kehadiran akan otomatis tersinkronisasi kembali ketika jaringan terhubung.',
  }
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = React.useState('Pemesanan & Tiket');
  const [openIndexes, setOpenIndexes] = React.useState<number[]>([]);

  const toggleFAQ = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  const categories = [
    { name: 'Pemesanan & Tiket', icon: Ticket },
    { name: 'Pembayaran', icon: CreditCard },
    { name: 'Kemitraan & Afiliasi', icon: UserCheck },
    { name: 'Scan Hari H', icon: MessageSquare },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#00F0FF] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Pusat Bantuan & FAQ
        </h1>
        <p className="text-slate-400 text-sm">
          Temukan jawaban atas pertanyaan umum seputar pemesanan tiket, metode pembayaran, program afiliasi, dan kendala lapangan.
        </p>
      </div>

      {/* Categories Tab */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                setActiveCategory(cat.name);
                setOpenIndexes([]);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border',
                isActive
                  ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                  : 'astro-glass text-slate-300 hover:text-white hover:border-white/25 border-white/10'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndexes.includes(index);
          return (
            <div
              key={index}
              className="astro-card rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 hover:border-white/20 transition-all shadow-md"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                <span className="font-semibold text-white text-sm sm:text-base">
                  {faq.question}
                </span>
                <span className="p-1 rounded-full bg-white/10 text-slate-300 shrink-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-white/10">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Banner */}
      <div className="astro-glass rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-white/10 shadow-2xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#060913]">
        <h3 className="font-bold text-white text-lg sm:text-xl">
          Masih Belum Menemukan Jawaban?
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Tim Customer Support kami siap membantu kendala transaksi atau pertanyaan teknis Anda setiap hari.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black text-slate-950 bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 transition shadow-[0_0_20px_rgba(8,173,174,0.4)] cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Hubungi Customer Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
