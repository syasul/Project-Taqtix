'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Loader2, Share2, DollarSign, Users } from 'lucide-react';

const COLORS = ['#08B4B5', '#10b981', '#f59e0b', '#64748b', '#8b5cf6'];

export default function DistributionAnalyticsPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['distribution-analytics', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/analytics/distribution`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const channelsData = analyticsResponse?.byChannel || [];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const chartData = channelsData.map((item: any) => ({
    name: item.channel === 'organic' ? 'Organik (Direct/Web)' : item.channel === 'affiliate' ? 'Afiliasi Partner' : item.channel,
    value: item.revenue,
    buyers: item.buyers,
  }));

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Atribusi Distribusi Tiket' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-[#08B4B5]" />
          Atribusi Distribusi Tiket
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Analisis sumber pendapatan penjualan tiket berdasarkan marketing channel.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis distribusi...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Card */}
          <Card className="lg:col-span-2 bg-white border-slate-200 p-6 flex flex-col justify-between rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Kontribusi Channel (Revenue)</CardTitle>
              <CardDescription className="text-xs text-slate-400">Pangsa omzet penjualan tiket per channel</CardDescription>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Belum ada data distribusi tercatat.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* List Card */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-900">Detail Sumber Pemasaran</h3>
            <div className="space-y-3">
              {chartData.map((item: any, idx: number) => (
                <div key={item.name} className="flex flex-col space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{item.name}</span>
                    <span 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span>{item.buyers} Pembeli</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <span>{formatRupiah(item.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
