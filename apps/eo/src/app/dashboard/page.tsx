'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  PartyPopper,
  Filter,
  ExternalLink,
  MapPin,
  Clock,
  QrCode,
  Store,
  Mic2,
  FileSpreadsheet,
  Edit3,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlEventId = searchParams?.get('eventId');
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId || 'all');

  // Keep state synced with URL if updated externally
  useEffect(() => {
    if (urlEventId) {
      setSelectedEventId(urlEventId);
    }
  }, [urlEventId]);

  // Fetch organizer events list
  const { data: eventsResponse, isLoading: isEventsLoading } = useQuery({
    queryKey: ['organizer-events-list'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

  const events = eventsResponse || [];

  // Fetch overview data (supports ?eventId query)
  const { data: overviewResponse, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['organizer-overview', selectedEventId],
    queryFn: async () => {
      const params = selectedEventId && selectedEventId !== 'all' ? { eventId: selectedEventId } : {};
      const res = await apiClient.get('/organizer/overview', { params });
      return res.data?.data;
    },
  });

  const overview = overviewResponse || {
    totalRevenue: 0,
    ticketsSold: 0,
    activeEvents: 0,
    workforcePresent: 0,
    trends: [],
    ticketCategories: [],
    recentTransactions: []
  };

  const handleEventFilterChange = (val: string | null) => {
    if (!val) return;
    setSelectedEventId(val);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (val === 'all') {
        url.searchParams.delete('eventId');
      } else {
        url.searchParams.set('eventId', val);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const isLoading = isOverviewLoading || isEventsLoading;
  const hasNoEvents = !isLoading && events.length === 0;
  const isEventSpecific = selectedEventId !== 'all';
  const currentEvent = isEventSpecific 
    ? (overview.event || events.find((e: any) => e.id === selectedEventId))
    : null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {isEventSpecific ? (
              <>
                Overview Event
                <Sparkles className="h-5 w-5 text-[#08B4B5]" />
              </>
            ) : (
              <>
                Ringkasan Eksekutif
                <Sparkles className="h-5 w-5 text-[#08B4B5]" />
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isEventSpecific 
              ? `Pantau metrik penjualan tiket, kuota, kehadiran, dan operasional untuk "${currentEvent?.title || 'event ini'}".`
              : 'Pantau pendapatan akumulatif, tren penjualan 6 bulan, dan operasional seluruh event Anda.'}
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
            <h3 className="text-base font-bold text-slate-900">Belum Ada Event Terdaftar</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Selamat datang di TAQtix Organizer Workspace. Buat event pertama Anda sekarang untuk mulai menjual tiket, memantau penjualan real-time, dan mengelola kru.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/events/new"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold px-6 py-2.5 text-xs shadow-md border-0"
                )}
              >
                Buat Event Pertama Anda &rarr;
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Event Filter Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-[#08B4B5] rounded-xl shrink-0">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Pilih Tampilan Overview</span>
                <span className="text-[11px] text-slate-500">
                  {isEventSpecific 
                    ? 'Menampilkan metrik khusus event yang dipilih' 
                    : 'Menampilkan data akumulatif seluruh event'}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-80">
              <Select value={selectedEventId} onValueChange={handleEventFilterChange}>
                <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-[#08B4B5]">
                  <SelectValue placeholder="Pilih Event..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all" className="text-xs font-bold text-[#08B4B5]">
                    🌐 Semua Event (Akumulatif)
                  </SelectItem>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      <div className="flex items-center justify-between gap-2 max-w-[280px]">
                        <span className="truncate">{e.title}</span>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0",
                          e.status === 'PUBLISHED' || e.status === 'published'
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        )}>
                          {e.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event Specific Banner Card */}
          {isEventSpecific && currentEvent && (
            <Card className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-0 shadow-sm overflow-hidden relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {currentEvent.bannerUrl ? (
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 shadow-sm">
                      <img 
                        src={currentEvent.bannerUrl} 
                        alt={currentEvent.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                        {currentEvent.title}
                      </h2>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        currentEvent.status === 'PUBLISHED' || currentEvent.status === 'published'
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      )}>
                        {currentEvent.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                      {currentEvent.startDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-teal-400" />
                          {new Date(currentEvent.startDate).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                      {currentEvent.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-teal-400" />
                          {currentEvent.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {currentEvent.slug && (
                    <a
                      href={`https://taqtix.id/event/${currentEvent.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition flex items-center gap-1.5"
                    >
                      <span>Lihat Halaman Publik</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/dashboard/events/${selectedEventId}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#08B4B5] hover:bg-[#079b9c] text-white shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>Buka Workspace Event</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Revenue */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEventSpecific ? 'Revenue Event Ini' : 'Total Pendapatan'}
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1 rounded-lg" />
                ) : (
                  <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatRupiah(overview.totalRevenue || 0)}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {isEventSpecific 
                    ? `${overview.completedTransactions || 0} transaksi lunas` 
                    : 'Akumulasi penjualan tiket lunas'}
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Tickets Sold */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
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
                  <Skeleton className="h-7 w-20 mt-1 rounded-lg" />
                ) : (
                  <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {overview.ticketsSold || 0}
                    {isEventSpecific && overview.totalQuota ? (
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        / {overview.totalQuota}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-slate-500 ml-1">Tiket</span>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {isEventSpecific && overview.remainingQuota !== undefined
                    ? `Sisa ${overview.remainingQuota} kuota tiket`
                    : 'Tiket berhasil terdistribusi'}
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Check-in / Active Events */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEventSpecific ? 'Check-in (Kehadiran)' : 'Event Aktif Hari Ini'}
                </CardTitle>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  {isEventSpecific ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1 rounded-lg" />
                ) : (
                  <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {isEventSpecific ? (
                      <>
                        {overview.checkInCount || 0}
                        <span className="text-xs font-normal text-slate-500 ml-1">Hadir</span>
                      </>
                    ) : (
                      <>
                        {overview.activeEvents || 0}
                        <span className="text-xs font-normal text-slate-500 ml-1">Event</span>
                      </>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {isEventSpecific ? (
                    overview.ticketsSold && overview.ticketsSold > 0 
                      ? `${Math.round(((overview.checkInCount || 0) / overview.ticketsSold) * 100)}% dari tiket terjual`
                      : 'Belum ada check-in tiket'
                  ) : (
                    'Sedang live & berjalan hari ini'
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Workforce Present */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
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
                  <Skeleton className="h-7 w-16 mt-1 rounded-lg" />
                ) : (
                  <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {overview.workforcePresent || 0}
                    {isEventSpecific && overview.totalWorkforce ? (
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        / {overview.totalWorkforce}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-slate-500 ml-1">Crew</span>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {isEventSpecific 
                    ? 'Kru terverifikasi di venue' 
                    : 'Kru tercheck-in di venue'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* If Event-Specific: Ticket Categories Performance Breakdown */}
          {isEventSpecific && overview.ticketCategories && overview.ticketCategories.length > 0 && (
            <Card className="bg-white border-slate-200/80 shadow-xs p-5 sm:p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-[#08B4B5]" />
                    Performa Kategori Tiket
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kapasitas kuota, tiket terjual, dan perolehan revenue per kategori
                  </p>
                </div>
                <Link
                  href={`/dashboard/events/${selectedEventId}/ticket-categories`}
                  className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  Kelola Tiket <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.ticketCategories.map((cat: any) => {
                  const percentage = cat.quota > 0 ? Math.min(100, Math.round((cat.sold / cat.quota) * 100)) : 0;
                  return (
                    <div 
                      key={cat.id} 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 truncate">{cat.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">
                            {formatRupiah(cat.price)}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          cat.remaining === 0
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : percentage >= 80
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {cat.remaining === 0 ? 'Habis' : `${percentage}% Terjual`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>{cat.sold} terjual</span>
                          <span>kuota {cat.quota}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5 bg-slate-200" />
                      </div>

                      <div className="pt-1 border-t border-slate-200/50 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="font-mono font-bold text-slate-800">{formatRupiah(cat.revenue || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Revenue Trends Chart */}
          <Card className="bg-white border-slate-200/80 shadow-xs p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl text-[#08B4B5]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isEventSpecific ? 'Tren Revenue Event' : 'Tren Revenue 6 Bulan'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pertumbuhan nilai transaksi kotor per bulan</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 uppercase font-mono self-start sm:self-auto">
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

          {/* If Event-Specific: Quick Access Shortcuts to Event Workspace Modules */}
          {isEventSpecific && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Akses Cepat Modul Event</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link
                  href={`/dashboard/events/${selectedEventId}/edit`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Detail Event</span>
                </Link>

                <Link
                  href={`/dashboard/events/${selectedEventId}/ticket-categories`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Kategori Tiket</span>
                </Link>

                <Link
                  href={`/dashboard/events/${selectedEventId}/lineup`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <Mic2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Line Up Acara</span>
                </Link>

                <Link
                  href={`/dashboard/events/${selectedEventId}/rundown`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Rundown</span>
                </Link>

                <Link
                  href={`/dashboard/events/${selectedEventId}/live`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Check-In Live</span>
                </Link>

                <Link
                  href={`/dashboard/events/${selectedEventId}/export`}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-2 transition group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Rekap Data</span>
                </Link>
              </div>
            </div>
          )}

          {/* Events List & Quick Actions (Shown when in Multi-Event Mode) */}
          {!isEventSpecific && (
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
                    events.slice(0, 5).map((e: any) => (
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

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                            e.status === 'PUBLISHED' || e.status === 'published'
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : "text-amber-700 bg-amber-50 border-amber-200"
                          )}>
                            {e.status}
                          </span>
                          <button
                            onClick={() => handleEventFilterChange(e.id)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#08B4B5] text-xs font-bold rounded-xl border border-teal-200 transition cursor-pointer"
                          >
                            Overview
                          </button>
                          <Link 
                            href={`/dashboard/events/${e.id}`}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                          >
                            Buka Workspace
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
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardSummaryPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
