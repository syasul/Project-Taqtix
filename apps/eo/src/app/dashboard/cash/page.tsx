'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
  Banknote,
  Loader2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface EventCashSummary {
  eventId: string;
  eventTitle: string;
  status: string;
  startDate: string;
  transactionCount: number;
  totalCash: number;
}

interface OrgCashSummary {
  grandTotalCash: number;
  totalEvents: number;
  events: EventCashSummary[];
}

export default function OrgCashPage() {
  const [data, setData] = useState<OrgCashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/cash/summary');
      setData(res.data?.data || res.data || null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat ringkasan kas organisasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const breadcrumbs = [
    { label: 'Keuangan' },
    { label: 'Rekonsiliasi Kas Organisasi' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <Banknote className="h-6 w-6 text-[#08B4B5]" />
          Rekonsiliasi Kas (Cash Management)
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Lacak dan rekonsiliasi seluruh peredaran uang tunai / cash on-site dari seluruh event Anda.
        </p>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
          {errorMsg}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Kas Terkumpul (Semua Event)
                </span>
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                Rp {data.grandTotalCash.toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Penerimaan tunai on-site & POS
              </span>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Event Terpantau
                </span>
                <Calendar className="h-5 w-5 text-[#08B4B5]" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{data.totalEvents} Event</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Event yang memiliki buku kas
              </span>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status Rekonsiliasi
                </span>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">Aktif & Sinkron</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Terkoneksi dengan POS & Gate
              </span>
            </div>
          </div>

          {/* Breakdown per Event Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-[#08B4B5]" />
                Rincian Kas per Event
              </h3>
            </div>

            {data.events.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada transaksi kas yang dicatat pada event manapun.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Nama Event</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Tanggal Event</th>
                      <th className="py-3.5 px-5 text-center">Jumlah Transaksi</th>
                      <th className="py-3.5 px-5 text-right">Total Kas</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.events.map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{ev.eventTitle}</td>
                        <td className="py-4 px-5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-mono">
                          {new Date(ev.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-5 text-center font-mono">{ev.transactionCount}</td>
                        <td className="py-4 px-5 text-right font-bold text-emerald-600 font-mono">
                          Rp {ev.totalCash.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link
                            href={`/dashboard/events/${ev.eventId}/cash`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#08B4B5] hover:underline transition"
                          >
                            Kelola Kas
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
