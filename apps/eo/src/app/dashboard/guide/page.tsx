'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ticket,
  Store,
  Gift,
  QrCode,
  Code2,
  Banknote,
  Users,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  summary: string;
  steps: string[];
}

const guides: GuideSection[] = [
  {
    id: 'events-tickets',
    title: '1. Membuat Event & Mengatur Kategori Tiket',
    icon: Ticket,
    summary: 'Langkah awal menerbitkan event dengan berbagai kategori harga dan kuota.',
    steps: [
      'Buka menu "Daftar Event" di sidebar organisasi lalu klik "+ Buat Event".',
      'Isi informasi judul, deskripsi, tanggal mulai & selesai, lokasi acara, serta banner poster.',
      'Setelah event dibuat, masuk ke menu "Kategori Tiket" untuk menambahkan tiket (misal Early Bird, VIP, Presale) beserta kuota dan harga.',
      'Publikasikan event ke status PUBLISHED agar halaman penjualan aktif dan dapat diakses pembeli.',
    ],
  },
  {
    id: 'forms-facilities',
    title: '2. Formulir Tambahan (Custom Fields) & Fasilitas (Add-ons)',
    icon: Sparkles,
    summary: 'Kumpulkan data kustom peserta (nomor ID, ukuran kaos) & jual merchandise add-on.',
    steps: [
      'Pilih event spesifik di sidebar lalu buka menu "Formulir Tambahan".',
      'Tambahkan pertanyaan teks, angka, dropdown pilihan, atau tanggal. Set apakah field wajib diisi (required).',
      'Buka menu "Fasilitas Event" untuk menambahkan paket add-on seperti Official T-Shirt, Shuttle Bus, atau Backstage Pass.',
      'Data formulir dan fasilitas yang dipilih pembeli otomatis terlampir pada e-tiket dan laporan rekap.',
    ],
  },
  {
    id: 'pos-cash',
    title: '3. Point of Sales (POS Kasir On-site) & Rekonsiliasi Kas',
    icon: Store,
    summary: 'Layani penjualan tiket langsung (go-show/walk-in) di venue dan catat arus kas tunai.',
    steps: [
      'Di sidebar event, buka menu "Point of Sales (POS)" yang telah dioptimalkan untuk perangkat tablet / laptop panitia.',
      'Pilih kategori tiket atau fasilitas yang dibeli, tentukan metode pembayaran (Cash, QRIS, atau Debit).',
      'Klik "Selesaikan Pembayaran". Sistem seketika membuat pesanan PAID dan men-generate QR tiket valid untuk pembeli.',
      'Transaksi tunai otomatis tercatat di menu "Cash Event" & "Cash Organisasi" untuk memudahkan serah-terima kasir.',
    ],
  },
  {
    id: 'doorprize-draw',
    title: '4. Pengundian Hadiah Doorprize Otomatis',
    icon: Gift,
    summary: 'Undi hadiah untuk penonton yang hadir secara transparan dari data check-in gate.',
    steps: [
      'Buka menu "Doorprize" pada event yang sedang berlangsung.',
      'Tambahkan item hadiah (misal Smartphone, Voucher Belanja, Smartwatch) beserta kuantitasnya.',
      'Klik "Undi Pemenang Sekarang". Sistem akan memilih 1 tiket acak dari daftar pengunjung yang telah sukses CHECK-IN di gerbang.',
      'Data pemenang langsung tersimpan dan dapat ditampilkan di layar panggung.',
    ],
  },
  {
    id: 'gate-wristband',
    title: '5. Validasi Tiket di Gerbang & Kode Gelang (Wristband)',
    icon: QrCode,
    summary: 'Manajemen gate check-in, penukaran tiket ke gelang fisik, dan pemblokiran pengunjung.',
    steps: [
      'Tugaskan anggota tim Anda sebagai "Gate Staff" di menu Staff Penugasan.',
      'Staff gerbang dapat membuka aplikasi scanner dan memindai QR dinamis penonton saat masuk.',
      'Untuk penukaran gelang, gunakan fitur "Generate Kode Gelang" lalu export CSV untuk dicetak pada wristband barcode.',
      'Jika ditemukan indikasi kecurangan, panitia dapat memblokir tiket pengunjung di menu "Pengunjung Nonaktif", sehingga scanner gerbang otomatis menolak dengan status 403 TICKET_BLOCKED.',
    ],
  },
  {
    id: 'api-automation',
    title: '6. Token Generator & Otomasi API Pihak Ketiga',
    icon: Code2,
    summary: 'Hubungkan TAQtix dengan CRM, WhatsApp Gateway, Google Sheets, atau Make / Zapier.',
    steps: [
      'Buka menu "Token Generator (API)" di sidebar organisasi (hanya role Owner).',
      'Pilih izin cakupan (scopes: read:events, read:orders, read:attendance) lalu generate token.',
      'Salin dan simpan secret token (taq_live_xxxx).',
      'Sertakan header X-API-Key: taq_live_xxxx pada setiap request API eksternal Anda.',
    ],
  },
];

export default function GuidePage() {
  const [openSection, setOpenSection] = useState<string | null>('events-tickets');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <BookOpen className="h-6 w-6" />
          </div>
          Panduan Penggunaan & Pusat Bantuan
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Pelajari seluruh alur kerja operasional event profesional mulai dari pembuatan tiket hingga eksekusi on-site.
        </p>
      </div>

      {/* Guide Accordions */}
      <div className="space-y-3">
        {guides.map((g) => {
          const Icon = g.icon;
          const isOpen = openSection === g.id;

          return (
            <div
              key={g.id}
              className={`border rounded-2xl transition overflow-hidden ${
                isOpen ? 'bg-slate-900/80 border-indigo-500/40' : 'bg-slate-900/40 border-slate-850'
              }`}
            >
              <button
                onClick={() => toggleSection(g.id)}
                className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isOpen
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{g.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{g.summary}</p>
                  </div>
                </div>

                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-850/60 text-xs text-slate-300">
                  <ol className="space-y-2.5 list-decimal list-inside pl-1 text-slate-300">
                    {g.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-slate-200 font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
