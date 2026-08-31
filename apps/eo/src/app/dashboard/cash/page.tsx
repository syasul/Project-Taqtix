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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <Banknote className="h-6 w-6" />
          </div>
          Rekonsiliasi Kas (Cash Management)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Lacak dan rekonsiliasi seluruh peredaran uang tunai / cash on-site dari seluruh event Anda.
        </p>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {errorMsg}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Kas Terkumpul (Semua Event)
                </span>
                <Coins className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-3">
                Rp {data.grandTotalCash.toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Penerimaan tunai on-site & POS
              </span>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Event Terpantau
                </span>
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-3">{data.totalEvents}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Event yang memiliki buku kas
              </span>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Rekonsiliasi
                </span>
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 mt-3">Aktif & Sinkron</p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Terkoneksi dengan POS & Gate
              </span>
            </div>
          </div>

          {/* Breakdown per Event Table */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-400" />
                Rincian Kas per Event
              </h3>
            </div>

            {data.events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada transaksi kas yang dicatat pada event manapun.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-850 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Nama Event</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Tanggal Event</th>
                      <th className="py-3.5 px-5 text-center">Jumlah Transaksi</th>
                      <th className="py-3.5 px-5 text-right">Total Kas</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300">
                    {data.events.map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-slate-850/30 transition">
                        <td className="py-4 px-5 font-bold text-slate-100">{ev.eventTitle}</td>
                        <td className="py-4 px-5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-400">
                          {new Date(ev.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-5 text-center font-mono">{ev.transactionCount}</td>
                        <td className="py-4 px-5 text-right font-bold text-emerald-400">
                          Rp {ev.totalCash.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link
                            href={`/dashboard/events/${ev.eventId}/cash`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
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
