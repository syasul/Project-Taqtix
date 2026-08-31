'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Download,
  FileSpreadsheet,
  QrCode,
  Users,
  Banknote,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function EventExportHubPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [generatingWristbands, setGeneratingWristbands] = useState(false);
  const [downloadingSection, setDownloadingSection] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerateWristbands = async () => {
    try {
      setGeneratingWristbands(true);
      const res = await apiClient.post(
        `/organizer/events/${eventId}/tickets/generate-wristband-codes`,
      );
      setSuccessMsg(res.data?.message || 'Kode gelang berhasil di-generate!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal generate wristband');
    } finally {
      setGeneratingWristbands(false);
    }
  };

  const handleDownload = async (type: 'orders' | 'attendance' | 'finance' | 'wristband') => {
    try {
      setDownloadingSection(type);
      let endpoint = '';
      let defaultFilename = `export-${type}-${eventId}.csv`;

      if (type === 'orders') {
        endpoint = `/organizer/events/${eventId}/export/orders?format=csv`;
      } else if (type === 'attendance') {
        endpoint = `/organizer/events/${eventId}/export/attendance?format=csv`;
      } else if (type === 'finance') {
        endpoint = `/organizer/events/${eventId}/export/financial-summary?format=csv`;
      } else if (type === 'wristband') {
        endpoint = `/organizer/events/${eventId}/tickets/wristband-export`;
      }

      const res = await apiClient.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mendownload data CSV');
    } finally {
      setDownloadingSection(null);
    }
  };

  const exportCards = [
    {
      id: 'orders',
      title: 'Rekap Semua Pesanan (Orders)',
      icon: FileSpreadsheet,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description:
        'Seluruh histori transaksi pembeli: ID order, email, nama peserta, nomor kontak, kategori tiket, kota, total bayar, dan status.',
      buttonText: 'Download CSV Pesanan',
    },
    {
      id: 'attendance',
      title: 'Laporan Kehadiran (Attendance)',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description:
        'Data penonton hadir dan belum hadir: ID tiket, waktu scan check-in, identitas staf scanner, kode gelang, dan status blokir.',
      buttonText: 'Download CSV Kehadiran',
    },
    {
      id: 'finance',
      title: 'Ringkasan Keuangan (Financial)',
      icon: Banknote,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description:
        'Rekapitulasi total pendapatan tiket online, kas tunai on-site, total diskon voucher yang terpakai, dan gross sales.',
      buttonText: 'Download CSV Keuangan',
    },
    {
      id: 'wristband',
      title: 'Data Kode Gelang (Wristbands)',
      icon: QrCode,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description:
        'Daftar kode wristband unik yang siap dicetak ke gelang barcode fisik untuk penukaran tiket di meja registrasi.',
      buttonText: 'Download CSV Wristband',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Download className="h-6 w-6" />
          </div>
          Pusat Rekap Data & Export Laporan
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Unduh laporan lengkap aktivitas tiket, kehadiran penonton, kas tunai, dan kode gelang dalam format CSV/Excel.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Batch Wristband Generator Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 inline-block mb-1.5">
            Persiapan Gelang Fisik On-site
          </span>
          <h3 className="text-base font-bold text-slate-100">
            Generate Kode Wristband Batch untuk Tiket
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Otomatis berikan kode 6-8 digit alphanumeric untuk seluruh tiket yang belum memiliki kode gelang.
          </p>
        </div>

        <button
          onClick={handleGenerateWristbands}
          disabled={generatingWristbands}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {generatingWristbands ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Kode Gelang Sekarang
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exportCards.map((card) => {
          const Icon = card.icon;
          const isDownloading = downloadingSection === card.id;

          return (
            <div
              key={card.id}
              className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-750 transition"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl border ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{card.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {card.description}
                </p>
              </div>

              <button
                onClick={() => handleDownload(card.id as any)}
                disabled={isDownloading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {card.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
