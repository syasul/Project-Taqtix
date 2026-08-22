'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Ticket, CreditCard, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    answer: 'Tiket yang sudah dibeli tidak dapat dibatalkan atau direfund, kecuali jika terjadi pembatalan sepihak dari pihak penyelenggara event. Kebijakan pemindahan kepemilikan tiket dapat bervariasi sesuai aturan masing-masing event.',
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-650 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Pusat Bantuan & FAQ
        </h1>
        <p className="text-slate-500 text-sm">
          Temukan jawaban atas pertanyaan umum seputar pemesanan tiket, metode pembayaran, program afiliasi, dan kendala lapangan.
        </p>
      </div>

      {/* Categories Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <button
              key={cat.name}
              onClick={() => {
                setActiveCategory(cat.name);
                setOpenIndexes([]);
              }}
              className={cn(
                "p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2.5 transition cursor-pointer",
                activeCategory === cat.name
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs font-bold leading-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, i) => {
          const isOpen = openIndexes.includes(i);
          return (
            <Card
              key={i}
              className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800 pr-4">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-6 pb-4 text-xs text-slate-550 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.answer}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Still Need Help */}
      <div className="text-center pt-8 border-t border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Masih Butuh Bantuan?</h3>
        <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
          Jika Anda tidak menemukan solusi yang Anda cari, jangan ragu untuk langsung berkonsultasi dengan tim dukungan support kami.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm text-xs cursor-pointer"
          >
            Hubungi Customer Service
          </Link>
        </div>
      </div>
    </div>
  );
}
