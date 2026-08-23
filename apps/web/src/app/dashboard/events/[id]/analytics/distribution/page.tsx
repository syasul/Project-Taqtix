'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Loader2, Share2, DollarSign, Users } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

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

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-indigo-500" />
          Atribusi Distribusi Tiket
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Analisis sumber pendapatan penjualan tiket berdasarkan marketing channel.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis distribusi...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Card */}
          <Card className="lg:col-span-2 bg-slate-900/40 border-slate-850 p-6 flex flex-col justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Kontribusi Channel (Revenue)</CardTitle>
              <CardDescription className="text-xs text-slate-500">Pangsa omzet penjualan tiket per channel</CardDescription>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
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
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* List Card */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-250">Detail Sumber Pemasaran</h3>
            <div className="space-y-4">
              {chartData.map((item: any, idx: number) => (
                <div key={item.name} className="flex flex-col space-y-1.5 p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{item.name}</span>
                    <span 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-500" />
                      <span>{item.buyers} Pembeli</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-slate-200">
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
