'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  status: string;
}

export default function OrgRecapPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/organizer/events');
        setEvents(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDownloadCrossEvent = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const res = await apiClient.get(`/organizer/export/cross-event-summary?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap-lintas-event-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mendownload rekap lintas event');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          Rekap Data & Laporan Organisasi
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Export laporan keuangan, performa penjualan tiket, dan kehadiran lintas seluruh acara.
        </p>
      </div>

      {/* Cross-Event Export Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block mb-2">
            Laporan Konsolidasi Lintas Event
          </span>
          <h2 className="text-xl font-bold text-slate-100">
            Export Ringkasan Semua Event (Cross-Event Summary)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Data mencakup seluruh metrik: total pesanan, tiket terjual, kehadiran checked-in, pendapatan online, kas tunai, dan gross sales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Dari Tanggal (Opsional)
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Sampai Tanggal (Opsional)
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleDownloadCrossEvent}
            disabled={downloading}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Rekap CSV Lintas Event
          </button>
        </div>
      </div>

      {/* Per Event Export Quick Access */}
      <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-850">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            Rekap Detail per Event
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Pilih event tertentu untuk mengunduh laporan pesanan, kehadiran, atau keuangan mendalam.
          </p>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Belum ada event yang dibuat.
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-850/30 transition gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{ev.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ev.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {ev.status}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/events/${ev.id}/export`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 shrink-0"
                >
                  Buka Rekap Event
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
