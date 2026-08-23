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
  Loader2 
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
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
  const activeEventsList = events.slice(0, 3); // Tampilkan 3 event teratas

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Ringkasan Eksekutif
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Pantau pendapatan akumulatif, tren penjualan bulanan, dan kelola seluruh event Anda.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                formatRupiah(overview.totalRevenue)
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Akumulasi penjualan tiket lunas</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tiket Terjual
            </CardTitle>
            <Ticket className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                `${overview.ticketsSold} Tiket`
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Total tiket berhasil terdistribusi</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Event Berjalan Hari Ini
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                `${overview.activeEvents} Event`
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Event aktif dipublikasi & sedang berjalan</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-slate-900/20 border-slate-850 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-200">Tren Pendapatan Bulanan</h3>
        </div>

        {isOverviewLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : overview.trends.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Belum ada transaksi terekam untuk analisis grafik tren.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.trends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `Rp${v/1000000}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                  itemStyle={{ color: '#f8fafc', fontSize: 12 }}
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick List Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-200">Event Terbaru</h3>
            <Link href="/dashboard/events" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Semua Event <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {isEventsLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            ) : activeEventsList.length === 0 ? (
              <div className="p-6 bg-slate-900/20 border border-slate-850 rounded-2xl text-center text-slate-500">
                Belum ada event yang terdaftar.
              </div>
            ) : (
              activeEventsList.map((e: any) => (
                <div 
                  key={e.id} 
                  className="p-5 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">{e.title}</h4>
                    <p className="text-xs text-slate-400">{e.location}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(e.startDate).toLocaleDateString('id-ID')} - {new Date(e.endDate).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                      e.status === 'PUBLISHED' || e.status === 'published'
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    )}>
                      {e.status}
                    </span>
                    <Link 
                      href={`/dashboard/events/${e.id}`}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-750 transition"
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
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Aksi Cepat</h3>

          <Card className="bg-slate-900/40 border-slate-850 p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Daftarkan Event Baru</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Buat konser, kajian, festival, atau seminar baru Anda ke platform TAQtix.
              </p>
            </div>
            <Link href="/dashboard/events/new" className={cn(buttonVariants({ variant: 'default' }), "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl flex items-center gap-2 font-bold cursor-pointer justify-center w-full py-2.5 shadow-lg shadow-indigo-600/10 h-auto text-xs")}>
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Buat Event</span>
            </Link>
          </Card>

          <Card className="bg-slate-900/40 border-slate-855 p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Ubah Tipe Paket</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Upgrade paket langganan Anda ke Pro / Enterprise untuk membuka fitur lanjutan.
              </p>
            </div>
            <div className="px-4 py-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-xl text-center">
              Paket Saat Ini: PRO
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
