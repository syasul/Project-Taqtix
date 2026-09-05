'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  MousePointerClick,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TicketPercent,
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  Banknote,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { initialAffiliateEvents } from '@/lib/data';
import { toast } from 'sonner';

export default function AffiliateDashboardOverviewPage() {
  const [events] = useState(initialAffiliateEvents);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalClicks = events.reduce((sum, e) => sum + e.clicks, 0);
  const totalBuyers = events.reduce((sum, e) => sum + e.buyersCount, 0);
  const totalTickets = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.revenueGenerated, 0);
  const totalCommission = events.reduce((sum, e) => sum + e.commissionEarned, 0);
  const availableBalance = 2733750; // Saldo yang belum ditarik

  const chartData = events.map((e) => ({
    name: e.eventTitle.length > 18 ? e.eventTitle.slice(0, 16) + '...' : e.eventTitle,
    'Pembeli (Orang)': e.buyersCount,
    'Tiket Terjual': e.ticketsSold,
  }));

  const handleCopyLink = (eventSlug: string, promoCode: string, id: string) => {
    const url = `https://taqtix.id/events/${eventSlug}?aff=${promoCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(`Tautan referral & promo ${promoCode} berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="px-3 py-1 bg-[#08B4B5]/20 border border-[#08B4B5]/40 text-[#08B4B5] rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Dashboard Mitra Afiliasi Taqtix
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang, Syamsul Ma’arif!
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Pantau berapa banyak orang yang telah menggunakan kode promo Anda di setiap event, lacak penjualan tiket secara real-time, dan tarik saldo komisi Anda kapan saja.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 shrink-0 space-y-3 w-full sm:w-auto">
          <div>
            <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">
              Saldo Komisi Tersedia
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
              Rp {availableBalance.toLocaleString('id-ID')}
            </span>
          </div>
          <Link
            href="/payouts"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Banknote className="w-4 h-4" />
            <span>Tarik Saldo Komisi</span>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS (Req 1: Keliatan berapa orang yang menggunakan kode promo) */}
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orang yang Menggunakan Kode Promo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pengguna Kode Promo
            </span>
            <div className="p-2 bg-[#08B4B5]/10 text-[#08B4B5] rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-2">
            {totalBuyers.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-slate-400">orang</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {totalTickets} tiket sukses dibeli
          </p>
        </div>

        {/* Total Klik Tautan Afiliasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Klik Referral
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-2">
            {totalClicks.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400">Konversi: {((totalBuyers / totalClicks) * 100).toFixed(1)}%</p>
        </div>

        {/* Total Omset Penjualan Tiket */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Omset Penjualan
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400">Dari seluruh event diikuti</p>
        </div>

        {/* Total Komisi Diperoleh */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Komisi Dihasilkan
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 font-mono mt-2">
            Rp {totalCommission.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Semua waktu</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Performa Penjualan per Event</h3>
            <p className="text-xs text-slate-400">
              Perbandingan jumlah orang yang menggunakan kode promo vs total lembar tiket yang terjual.
            </p>
          </div>
          <Link
            href="/events"
            className="text-xs font-bold text-[#08B4B5] hover:text-[#079b9c] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Kelola Kode Tiap Event</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="h-72 w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Pembeli (Orang)" fill="#08B4B5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Tiket Terjual" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DAFTAR EVENT & PENGGUNAAN KODE PROMO */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kode Promo & Referral Tiap Event</h3>
            <p className="text-xs text-slate-400">
              Setiap event memiliki kode promo dan tautan khusus yang dapat Anda bagikan ke audiens Anda.
            </p>
          </div>
          <Link
            href="/events"
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Lihat Semua Event
          </Link>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
            >
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {evt.eventLocation} • {new Date(evt.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{evt.eventTitle}</h4>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono font-bold text-xs text-[#08B4B5] bg-[#08B4B5]/10 px-2.5 py-1 rounded-lg border border-[#08B4B5]/20">
                    {evt.promoCode}
                  </span>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Diskon: {evt.discountType === 'percentage' ? `${evt.discountValue}%` : `Rp ${evt.discountValue.toLocaleString('id-ID')}`}
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold">
                    Komisi: {evt.commissionType === 'percentage' ? `${evt.commissionValue}%` : `Rp ${evt.commissionValue.toLocaleString('id-ID')}/tiket`}
                  </span>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-nowrap items-start sm:items-center gap-4 sm:gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-semibold">Pengguna Kode:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {evt.buyersCount} Orang ({evt.ticketsSold} Tiket)
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Omset: Rp {evt.revenueGenerated.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-semibold">Komisi Diperoleh:</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">
                    Rp {evt.commissionEarned.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyLink(evt.eventSlug, evt.promoCode, evt.id)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                >
                  {copiedId === evt.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link Promo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
