'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, Ticket, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SalesAnalyticsPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['sales-analytics', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/analytics/sales`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const salesData = analyticsResponse || { byCategory: [], byDay: [] };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Filter byDay based on dateRange toggle
  const filteredDailyData = useMemo(() => {
    const daily = salesData.byDay || [];
    if (dateRange === '7d') {
      return daily.slice(-7);
    } else if (dateRange === '30d') {
      return daily.slice(-30);
    }
    return daily;
  }, [salesData.byDay, dateRange]);

  const totalRevenue = useMemo(() => {
    return (salesData.byDay || []).reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);
  }, [salesData.byDay]);

  const totalTickets = useMemo(() => {
    return (salesData.byCategory || []).reduce((acc: number, curr: any) => acc + (curr.ticketsSold || curr.qty || 0), 0);
  }, [salesData.byCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#08B4B5]" />
            Laporan Analitik Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pergerakan omzet harian dan distribusi volume tiket per kategori.
          </p>
        </div>

        {/* Date Range Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setDateRange('7d')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
              dateRange === '7d'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
              dateRange === '30d'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            30 Hari Terakhir
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
              dateRange === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Menghitung data penjualan...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Penjualan</p>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {formatRupiah(totalRevenue)}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
            </Card>

            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tiket Terjual</p>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {totalTickets.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-400">Tiket</span>
                </div>
              </div>
              <div className="p-3 bg-teal-50 text-[#08B4B5] rounded-xl">
                <Ticket className="h-6 w-6" />
              </div>
            </Card>
          </div>

          {/* Daily Trend Line Chart */}
          <Card className="bg-white border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Tren Penjualan Harian</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Pergerakan nilai transaksi masuk ({dateRange === '7d' ? '7 hari' : dateRange === '30d' ? '30 hari' : 'semua'})
                </CardDescription>
              </div>
              <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 uppercase font-mono">
                Line Trend
              </span>
            </div>

            {filteredDailyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Belum ada transaksi terekam pada rentang waktu ini.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      tickFormatter={(v) => `Rp${v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : (v >= 1000 ? `${(v/1000).toFixed(0)}K` : v)}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#08B4B5" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#08B4B5' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Category Breakdown Bar Chart */}
          <Card className="bg-white border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-xs">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Jumlah Tiket Terjual per Kategori</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Perbandingan volume tiket terjual berdasarkan varian kategori
              </CardDescription>
            </div>

            {salesData.byCategory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Belum ada tiket terjual untuk kategori manapun.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="categoryName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatRupiah(Number(value)) : `${value} Tiket`,
                        name === 'revenue' ? 'Pendapatan' : 'Terjual'
                      ]}
                    />
                    <Bar dataKey="ticketsSold" fill="#08B4B5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
