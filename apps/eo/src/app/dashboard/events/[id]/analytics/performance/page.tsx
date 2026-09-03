'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
    { stage: 'Landing Page Views', count: perf.landingPageViews, fill: '#08B4B5' },
    { stage: 'Checkout Started', count: perf.checkoutStarted, fill: '#0d9488' },
    { stage: 'Purchase Completed', count: perf.checkoutCompleted, fill: '#10b981' },
  ];

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Kinerja Konversi Funnel' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Kanban className="h-5 w-5 text-[#08B4B5]" />
          Kinerja Konversi (Funnel)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pantau rasio konversi corong checkout dan rata-rata durasi pembelian tiket.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis performa...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Funnel Graph */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Grafik Corong Konversi (Funnel)</CardTitle>
              <CardDescription className="text-xs text-slate-400">Jumlah traffic pengunjung pada setiap tahapan checkout</CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Landing Page Views Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                <div className="h-10 w-10 bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] rounded-xl flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Landing Views</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{perf.landingPageViews}</span>
                </div>
              </div>

              {/* Checkout Started Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checkout Started</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">{perf.checkoutStarted}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#08B4B5] font-mono bg-teal-50 px-2 py-0.5 border border-[#08B4B5]/30 rounded-lg">
                  {perf.landingPageViews > 0 ? ((perf.checkoutStarted / perf.landingPageViews) * 100).toFixed(0) : 0}%
                </span>
              </div>

              {/* Purchase Completed Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">{perf.checkoutCompleted}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-lg">
                  {perf.checkoutStarted > 0 ? ((perf.checkoutCompleted / perf.checkoutStarted) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* Funnel chart container */}
            <div className="h-64 w-full text-xs font-mono mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={140} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Checkout Speed & Refund Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 p-6 flex items-center gap-4 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400">Durasi Transaksi Rata-Rata</span>
                <h4 className="text-2xl font-bold text-slate-900 font-mono">
                  {perf.avgCheckoutTimeSeconds} Detik
                </h4>
                <p className="text-[10px] text-slate-400">Waktu yang dibutuhkan buyer dari klik checkout hingga lunas</p>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-6 flex items-center gap-4 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <RefreshCcw className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400">Rasio Refund / Pembatalan</span>
                <h4 className="text-2xl font-bold text-slate-900 font-mono">
                  {(perf.refundRate * 100).toFixed(1)}%
                </h4>
                <p className="text-[10px] text-slate-400">Persentase tiket refund dibandingkan total pembelian sukses</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
