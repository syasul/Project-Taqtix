'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Ticket, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ExternalLink,
  Edit3,
  Mic2,
  QrCode,
  FileSpreadsheet,
  Store,
  HeartHandshake,
  Loader2,
  ChevronRight,
  Layers
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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

export default function EventOverviewWorkspacePage() {
  const params = useParams();
  const eventId = params?.id as string;

  const { data: overviewResponse, isLoading } = useQuery({
    queryKey: ['organizer-overview', eventId],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/overview', {
        params: { eventId },
      });
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const overview = overviewResponse || {
    totalRevenue: 0,
    ticketsSold: 0,
    totalQuota: 0,
    remainingQuota: 0,
    checkInCount: 0,
    workforcePresent: 0,
    totalWorkforce: 0,
    completedTransactions: 0,
    trends: [],
    ticketCategories: [],
    recentTransactions: [],
  };

  const event = overview.event;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: event?.title || 'Overview Event' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <Breadcrumb items={breadcrumbs} />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          {/* Event Header Banner */}
          <Card className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 border-0 shadow-sm overflow-hidden relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {event?.bannerUrl ? (
                  <div className="w-24 sm:w-28 h-18 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 shadow-sm">
                    <img 
                      src={event.bannerUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
                      {event?.title || 'Event Overview'}
                    </h1>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                      event?.status === 'PUBLISHED' || event?.status === 'published'
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    )}>
                      {event?.status || 'DRAFT'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
                    {event?.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-teal-400" />
                        {new Date(event.startDate).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    )}
                    {event?.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {event?.slug && (
                  <a
                    href={`https://taqtix.id/event/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition flex items-center gap-1.5"
                  >
                    <span>Halaman Publik</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Link
                  href={`/dashboard/events/${eventId}/edit`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#08B4B5] hover:bg-[#079b9c] text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Event</span>
                </Link>
              </div>
            </div>
          </Card>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Pendapatan
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {formatRupiah(overview.totalRevenue || 0)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {overview.completedTransactions || 0} transaksi lunas
                </p>
              </CardContent>
            </Card>

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
                <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {overview.ticketsSold || 0}
                  {overview.totalQuota ? (
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      / {overview.totalQuota}
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-slate-500 ml-1">Tiket</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Sisa {overview.remainingQuota || 0} kuota tiket
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Check-In (Hadir)
                </CardTitle>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {overview.checkInCount || 0}
                  <span className="text-xs font-normal text-slate-500 ml-1">Tamu</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {overview.ticketsSold && overview.ticketsSold > 0 
                    ? `${Math.round(((overview.checkInCount || 0) / overview.ticketsSold) * 100)}% dari tiket terjual`
                    : 'Belum ada check-in tiket'}
                </p>
              </CardContent>
            </Card>

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
                <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {overview.workforcePresent || 0}
                  {overview.totalWorkforce ? (
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      / {overview.totalWorkforce}
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-slate-500 ml-1">Crew</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Kru hadir terverifikasi
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Shortcuts Hub */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Menu Cepat Workspace
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <Link
                href={`/dashboard/events/${eventId}/edit`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <Edit3 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Detail Event</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/ticket-categories`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <Ticket className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Tiket</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/lineup`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <Mic2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Line Up</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/rundown`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Rundown</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/pos`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Kasir POS</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/live`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <QrCode className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Check-In Live</span>
              </Link>

              <Link
                href={`/dashboard/events/${eventId}/export`}
                className="p-3.5 bg-white border border-slate-200/80 hover:border-[#08B4B5] hover:shadow-xs rounded-2xl flex flex-col items-center text-center gap-1.5 transition group"
              >
                <div className="p-2 rounded-xl bg-teal-50 text-[#08B4B5] group-hover:bg-[#08B4B5] group-hover:text-white transition">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Laporan</span>
              </Link>
            </div>
          </div>

          {/* Ticket Categories Performance Breakdown */}
          {overview.ticketCategories && overview.ticketCategories.length > 0 && (
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
                  href={`/dashboard/events/${eventId}/ticket-categories`}
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
                    Tren Revenue Penjualan
                  </h3>
                  <p className="text-[11px] text-slate-400">Pertumbuhan nilai transaksi kotor event ini</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 uppercase font-mono self-start sm:self-auto">
                IDR Transaksi
              </span>
            </div>

            {overview.trends.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <TrendingUp className="h-8 w-8 text-slate-300" />
                <span>Belum ada transaksi terekam untuk event ini.</span>
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

          {/* 5 Recent Transactions */}
          {overview.recentTransactions && overview.recentTransactions.length > 0 && (
            <Card className="bg-white border-slate-200/80 shadow-xs p-5 sm:p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transaksi Terakhir</h3>
                  <p className="text-[11px] text-slate-400">5 pemesanan tiket terbaru yang sudah lunas</p>
                </div>
                <Link
                  href={`/dashboard/events/${eventId}/buyers`}
                  className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  Semua Pembeli <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {overview.recentTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{tx.customerName}</span>
                        <span className="text-[10px] font-mono text-slate-400">#{tx.orderNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{tx.customerEmail}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {tx.ticketsCount} Tiket
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {formatRupiah(tx.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

