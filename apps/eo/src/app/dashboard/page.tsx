'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Ticket, 
  Users,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardSummaryPage() {
  const { data: overviewResponse, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['organizer-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/overview');
      return res.data?.data;
    },
  });

  const { data: eventsResponse, isLoading: isEventsLoading } = useQuery({
    queryKey: ['organizer-events-list'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

  const overview = overviewResponse || {
    totalRevenue: 0,
    ticketsSold: 0,
    activeEvents: 0,
    workforcePresent: 0,
    trends: []
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const events = eventsResponse || [];
  const activeEventsList = events.slice(0, 4);

  const isLoading = isOverviewLoading || isEventsLoading;
  const hasNoEvents = !isLoading && events.length === 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Ringkasan Eksekutif
            <Sparkles className="h-5 w-5 text-[#08B4B5]" />
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pantau pendapatan akumulatif, tren penjualan 6 bulan, dan operasional seluruh event Anda.
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className={cn(
            buttonVariants({ variant: 'default' }),
            "bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl flex items-center gap-2 font-bold cursor-pointer py-2.5 px-4 shadow-sm h-auto text-xs border-0 self-start sm:self-auto"
          )}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Event Baru</span>
        </Link>
      </div>

      {/* Empty State when organizer has no events at all */}
      {hasNoEvents ? (
        <Card className="bg-white border-dashed border-2 border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-teal-50 text-[#08B4B5] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <PartyPopper className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Belum Ada Event Aktif</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Organizer Anda siap menerbitkan event pertama! Mulai jual tiket online, kelola tim, pantau analitik penjualan, dan manfaatkan fitur workforce dalam hitungan menit.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard/events/new"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl px-6 py-3 font-bold text-sm shadow-md transition hover:shadow-lg inline-flex items-center gap-2 border-0"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Buat Event Pertama Kamu</span>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Revenue */}
            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Pendapatan
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {formatRupiah(overview.totalRevenue)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Akumulasi penjualan tiket lunas</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Total Tiket Terjual */}
            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tiket Terjual
                </CardTitle>
                <div className="p-2 bg-teal-50 rounded-xl text-[#08B4B5]">
                  <Ticket className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {overview.ticketsSold.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Tiket</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Tiket berhasil terdistribusi</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Event Aktif Hari Ini */}
            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Event Aktif Hari Ini
                </CardTitle>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {overview.activeEvents} <span className="text-sm font-semibold text-slate-500">Event</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Sedang live & berjalan hari ini</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card 4: Workforce Present Hari Ini */}
            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Workforce Present
                </CardTitle>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {overview.workforcePresent || 0} <span className="text-sm font-semibold text-slate-500">Crew</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Kru tercheck-in di venue</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 6-Month Revenue Trend LineChart */}
          <Card className="bg-white border-slate-200/80 shadow-xs p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-xl text-[#08B4B5]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tren Revenue 6 Bulan</h3>
                  <p className="text-[11px] text-slate-400">Pertumbuhan nilai transaksi kotor per bulan</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 uppercase font-mono">
                IDR Transaksi
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3 pt-4">
                <Skeleton className="h-56 w-full rounded-xl" />
              </div>
            ) : overview.trends.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <TrendingUp className="h-8 w-8 text-slate-300" />
                <span>Belum ada transaksi terekam dalam periode 6 bulan terakhir.</span>
              </div>
            ) : (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overview.trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#f1f5f9' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `Rp${v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : (v >= 1000 ? `${(v/1000).toFixed(0)}K` : v)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderColor: '#e2e8f0', 
                        borderRadius: '0.75rem', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      itemStyle={{ color: '#08B4B5', fontWeight: 'bold' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#08B4B5" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#08B4B5', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#08B4B5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Events List & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Event Anda</h3>
                <Link href="/dashboard/events" className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1">
                  Lihat Semua Event <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : (
                  activeEventsList.map((e: any) => (
                    <div 
                      key={e.id} 
                      className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{e.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{e.location}</p>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(e.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                          e.status === 'PUBLISHED' || e.status === 'published'
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        )}>
                          {e.status}
                        </span>
                        <Link 
                          href={`/dashboard/events/${e.id}/edit`}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                        >
                          Buka Event
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Aksi Pintar</h3>

              <Card className="bg-white border-slate-200/80 shadow-xs p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Kelola Akses Tim</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Undang admin, finance, atau marketing untuk kelola event bersama.
                  </p>
                </div>
                <Link
                  href="/dashboard/settings/team"
                  className="inline-flex items-center justify-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                >
                  Buka Pengaturan Tim
                </Link>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-xs p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rekening Settlement</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pastikan rekening bank pencairan dana tiket Anda sudah terdaftar.
                  </p>
                </div>
                <Link
                  href="/dashboard/settings/payment"
                  className="inline-flex items-center justify-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                >
                  Kelola Rekening
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
