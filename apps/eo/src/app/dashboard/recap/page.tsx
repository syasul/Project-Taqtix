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
import { Breadcrumb } from '@/components/ui/breadcrumb';

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

  const breadcrumbs = [
    { label: 'Laporan' },
    { label: 'Rekap Data Organisasi' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <FileSpreadsheet className="h-6 w-6 text-[#08B4B5]" />
          Rekap Data & Laporan Organisasi
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Export laporan keuangan, performa penjualan tiket, dan kehadiran lintas seluruh acara.
        </p>
      </div>

      {/* Cross-Event Export Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-[#08B4B5]/30 inline-block mb-2">
            Laporan Konsolidasi Lintas Event
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Export Ringkasan Semua Event (Cross-Event Summary)
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Data mencakup seluruh metrik: total pesanan, tiket terjual, kehadiran checked-in, pendapatan online, kas tunai, dan gross sales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Dari Tanggal (Opsional)
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Sampai Tanggal (Opsional)
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleDownloadCrossEvent}
            disabled={downloading}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer border-0"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Download Rekap CSV Lintas Event</span>
          </button>
        </div>
      </div>

      {/* Per Event Export Quick Access */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#08B4B5]" />
            Rekap Detail per Event
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Pilih event tertentu untuk mengunduh laporan pesanan, kehadiran, atau keuangan mendalam.
          </p>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada event yang dibuat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ev.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {ev.status}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/events/${ev.id}/export`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200 shrink-0"
                >
                  <span>Buka Rekap Event</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#08B4B5]" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
