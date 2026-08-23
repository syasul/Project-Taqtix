'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Loader2, Kanban, Zap, Eye, ShoppingCart, CheckCircle, RefreshCcw } from 'lucide-react';

export default function PerformanceAnalyticsPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['performance-analytics', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/analytics/performance`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const perf = analyticsResponse || {
    landingPageViews: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0,
    conversionRate: 0,
    avgCheckoutTimeSeconds: 0,
    refundRate: 0,
  };

  const funnelData = [
    { stage: 'Landing Page Views', count: perf.landingPageViews, fill: '#6366f1' },
    { stage: 'Checkout Started', count: perf.checkoutStarted, fill: '#8b5cf6' },
    { stage: 'Purchase Completed', count: perf.checkoutCompleted, fill: '#10b981' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Kanban className="h-5 w-5 text-indigo-500" />
          Kinerja Konversi (Funnel)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Pantau rasio konversi corong checkout dan rata-rata durasi pembelian tiket.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis performa...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Funnel Graph */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Grafik Corong Konversi (Funnel)</CardTitle>
              <CardDescription className="text-xs text-slate-500">Jumlah traffic pengunjung pada setiap tahapan checkout</CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Landing Page Views Card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Landing Page Views</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">{perf.landingPageViews}</span>
                </div>
              </div>

              {/* Checkout Started Card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Checkout Started</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{perf.checkoutStarted}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 border border-purple-500/20 rounded-lg">
                  {perf.landingPageViews > 0 ? ((perf.checkoutStarted / perf.landingPageViews) * 100).toFixed(0) : 0}%
                </span>
              </div>

              {/* Purchase Completed Card */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Purchase Completed</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{perf.checkoutCompleted}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-lg">
                  {perf.checkoutStarted > 0 ? ((perf.checkoutCompleted / perf.checkoutStarted) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* Funnel chart container */}
            <div className="h-64 w-full text-xs font-mono mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="stage" type="category" stroke="#64748b" width={130} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Checkout Speed & Refund Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/40 border-slate-850 p-6 flex items-center gap-5">
              <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">Durasi Transaksi Rata-Rata</span>
                <h4 className="text-2xl font-bold text-slate-200 font-mono">
                  {perf.avgCheckoutTimeSeconds} Detik
                </h4>
                <p className="text-[10px] text-slate-500">Waktu yang dibutuhkan buyer dari klik checkout hingga lunas</p>
              </div>
            </Card>

            <Card className="bg-slate-900/40 border-slate-850 p-6 flex items-center gap-5">
              <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
                <RefreshCcw className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">Rasio Refund / Pembatalan</span>
                <h4 className="text-2xl font-bold text-slate-200 font-mono">
                  {(perf.refundRate * 100).toFixed(1)}%
                </h4>
                <p className="text-[10px] text-slate-500">Persentase tiket refund dibandingkan total pembelian sukses</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
