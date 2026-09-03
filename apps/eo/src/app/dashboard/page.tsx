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
  Loader2,
  Sparkles 
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Ringkasan Eksekutif
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Pantau pendapatan akumulatif, tren penjualan bulanan, dan kelola seluruh event Anda.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Pendapatan
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#08B4B5]" />
              ) : (
                formatRupiah(overview.totalRevenue)
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Akumulasi penjualan tiket lunas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tiket Terjual
            </CardTitle>
            <div className="p-2 bg-teal-50 rounded-lg text-[#08B4B5]">
              <Ticket className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#08B4B5]" />
              ) : (
                `${overview.ticketsSold} Tiket`
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total tiket berhasil terdistribusi</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Event Aktif Berjalan
            </CardTitle>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {isOverviewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#08B4B5]" />
              ) : (
                `${overview.activeEvents} Event`
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Event dipublikasi & aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#08B4B5]" />
            <h3 className="text-base font-bold text-slate-900">Tren Pendapatan Penjualan</h3>
          </div>
          <span className="text-[10px] font-bold text-[#08B4B5] bg-[#08B4B5]/10 px-2.5 py-1 rounded-full border border-[#08B4B5]/20 uppercase font-mono">
            IDR Transaksi
          </span>
        </div>

        {isOverviewLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          </div>
        ) : overview.trends.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Belum ada data transaksi terekam untuk analisis grafik.
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `Rp${v/1000000}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontSize: 12, fontWeight: 'bold' }}
                  itemStyle={{ color: '#08B4B5', fontSize: 12, fontWeight: 'bold' }}
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#08B4B5" 
                  strokeWidth={3}
                  fill="#08B4B5"
                  fillOpacity={0.08} 
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
            <h3 className="text-base font-bold text-slate-900">Event Terbaru</h3>
            <Link href="/dashboard/events" className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1">
              Lihat Semua Event <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isEventsLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 text-[#08B4B5] animate-spin" />
              </div>
            ) : activeEventsList.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                Belum ada event yang dibuat.
              </div>
            ) : (
              activeEventsList.map((e: any) => (
                <div 
                  key={e.id} 
                  className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{e.title}</h4>
                    <p className="text-xs text-slate-500">{e.location}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(e.startDate).toLocaleDateString('id-ID')} - {new Date(e.endDate).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
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
          <h3 className="text-base font-bold text-slate-900">Aksi Cepat</h3>

          <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftarkan Event Baru</h3>
              <p className="text-xs text-slate-500 mt-1">
                Buat konser, kajian, festival, atau seminar baru Anda ke platform TAQtix.
              </p>
            </div>
            <Link
              href="/dashboard/events/new"
              className={cn(
                buttonVariants({ variant: 'default' }),
                "bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl flex items-center gap-2 font-bold cursor-pointer justify-center w-full py-2.5 shadow-sm h-auto text-xs border-0"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Buat Event Baru</span>
            </Link>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Paket Langganan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Akses fitur multi-staff, doorprize, broadcast WhatsApp, dan integrasi API.
              </p>
            </div>
            <div className="px-4 py-2 bg-teal-50 border border-[#08B4B5]/20 text-[#08B4B5] text-[10px] font-bold uppercase tracking-wider rounded-xl text-center">
              Tier Akun: PRO PLAN
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
