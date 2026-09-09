'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Loader2, Share2, DollarSign, Users, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#08B4B5', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#64748b'];

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

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'organic':
        return 'Organic (Direct / Website)';
      case 'affiliate':
        return 'Affiliate Partner';
      case 'instagram':
        return 'Instagram Campaign';
      case 'tiktok':
        return 'TikTok Ads';
      case 'facebook':
        return 'Meta Facebook Ads';
      default:
        return channel;
    }
  };

  const chartData = channelsData.map((item: any) => ({
    name: getChannelLabel(item.channel),
    value: item.revenue || 0,
    buyers: item.buyers || 0,
    channel: item.channel,
  }));

  const totalRevenue = channelsData.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
  const totalBuyers = channelsData.reduce((sum: number, c: any) => sum + (c.buyers || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-[#08B4B5]" />
          Atribusi Kanal Distribusi Tiket
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pantau persentase penjualan tiket berdasarkan saluran marketing, referral afiliasi, dan lalu lintas organik.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Menghitung atribusi kanal...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <Card className="lg:col-span-1 bg-white border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Proporsi Revenue Kanal</CardTitle>
                <CardDescription className="text-xs text-slate-400">Pangsa omzet per saluran</CardDescription>
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  Belum ada data distribusi kanal.
                </div>
              ) : (
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                        formatter={(value: any) => [formatRupiah(Number(value)), 'Omzet']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Table Detail */}
            <Card className="lg:col-span-2 bg-white border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Rincian Angka Presisi per Kanal</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Total pembeli, omzet, dan kontribusi</CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{formatRupiah(totalRevenue)}</span>
                  <p className="text-[10px] text-slate-400 font-mono">{totalBuyers} Pembeli Total</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Kanal Marketing</th>
                      <th className="pb-3 text-right">Pembeli</th>
                      <th className="pb-3 text-right">Total Pendapatan</th>
                      <th className="pb-3 text-right">Pangsa (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {channelsData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Belum ada transaksi terekam untuk kanal manapun.
                        </td>
                      </tr>
                    ) : (
                      channelsData.map((channel: any, idx: number) => {
                        const pct = totalRevenue > 0 ? ((channel.revenue / totalRevenue) * 100).toFixed(1) : '0';
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                              />
                              <span className="font-bold text-slate-900">{getChannelLabel(channel.channel)}</span>
                            </td>
                            <td className="py-3 text-right font-mono text-slate-600">
                              {channel.buyers.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900 font-mono">
                              {formatRupiah(channel.revenue)}
                            </td>
                            <td className="py-3 text-right font-mono text-[#08B4B5] font-bold">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
