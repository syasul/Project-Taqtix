'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Analitik Penjualan' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#08B4B5]" />
          Analitik Penjualan Detail
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pantau grafik tren harian dan perbandingan kapasitas per kategori tiket.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis penjualan...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trend Chart */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Grafik Penjualan Harian</CardTitle>
              <CardDescription className="text-xs text-slate-400">Akumulasi penjualan tiket per hari</CardDescription>
            </div>

            {salesData.byDay.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Belum ada data penjualan tercatat.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#08B4B5" strokeWidth={2} fill="#e6f7f7" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Category Breakdown Chart */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Penjualan per Kategori</CardTitle>
              <CardDescription className="text-xs text-slate-400">Pendapatan kotor per kategori tiket</CardDescription>
            </div>

            {salesData.byCategory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Belum ada data kategori tiket.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="categoryName" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Bar dataKey="revenue" fill="#08B4B5" radius={[6, 6, 0, 0]} />
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
