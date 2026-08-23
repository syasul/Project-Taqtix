'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, Ticket } from 'lucide-react';

export default function SalesAnalyticsPage() {
  const params = useParams();
  const eventId = params?.id as string;

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

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          Analitik Penjualan Detail
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Pantau grafik tren harian dan perbandingan kapasitas per kategori tiket.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis penjualan...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Trend Chart */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Grafik Penjualan Harian</CardTitle>
              <CardDescription className="text-xs text-slate-500">Akumulasi penjualan tiket per hari</CardDescription>
            </div>

            {salesData.byDay.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                Belum ada data penjualan tercatat.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData.byDay}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Category Breakdown Chart */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Penjualan per Kategori</CardTitle>
              <CardDescription className="text-xs text-slate-500">Pendapatan kotor per kategori tiket</CardDescription>
            </div>

            {salesData.byCategory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                Belum ada data kategori tiket.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="categoryName" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
