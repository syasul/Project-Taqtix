'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, 
  Kanban, 
  Zap, 
  Eye, 
  ShoppingCart, 
  CheckCircle, 
  RefreshCcw, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const views = perf.landingPageViews || 0;
  const started = perf.checkoutStarted || 0;
  const completed = perf.checkoutCompleted || 0;

  // Conversion dropoff percentages
  const startedPct = views > 0 ? Math.round((started / views) * 100) : 0;
  const completedPct = views > 0 ? Math.round((completed / views) * 100) : 0;
  const checkoutConversionPct = started > 0 ? Math.round((completed / started) * 100) : 0;

  const formatSeconds = (seconds: number) => {
    if (!seconds) return '0 dtk';
    if (seconds < 60) return `${Math.round(seconds)} dtk`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Kanban className="h-5 w-5 text-[#08B4B5]" />
          Kinerja Konversi Funnel Tiket
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pantau rasio konversi pengunjung dari halaman detail tiket, memulai checkout, hingga pembayaran lunas.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Menghitung konversi funnel...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Konversi Total</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {perf.conversionRate || completedPct}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pengunjung yang sukses menyelesaikan pembelian
              </p>
            </Card>

            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Waktu Checkout</span>
                <div className="p-2 bg-teal-50 text-[#08B4B5] rounded-xl">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatSeconds(perf.avgCheckoutTimeSeconds)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Waktu dari mulai isi data sampai transaksi sukses
              </p>
            </Card>

            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Refund / Batal</span>
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <RefreshCcw className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {perf.refundRate || 0}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Tiket yang dibatalkan atau direfund resmi
              </p>
            </Card>
          </div>

          {/* Funnel Visual: Horizontal Step Bar */}
          <Card className="bg-white border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-6">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Alur Funnel Konversi Pengunjung</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Visualisasi titik drop-off dari landing page pengunjung hingga transaksi checkout lunas
              </CardDescription>
            </div>

            <div className="space-y-4 max-w-3xl">
              {/* Step 1: Landing Page Views */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    <span>1. Landing Page Views</span>
                  </div>
                  <span className="font-mono text-slate-900">{views.toLocaleString('id-ID')} views (100%)</span>
                </div>
                <div className="h-8 bg-slate-100 rounded-xl overflow-hidden p-1 flex">
                  <div 
                    className="h-full bg-[#08B4B5] rounded-lg transition-all duration-500 flex items-center px-3 text-[11px] font-bold text-white"
                    style={{ width: '100%' }}
                  >
                    100%
                  </div>
                </div>
              </div>

              {/* Step 2: Checkout Started */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-50 rounded-lg text-[#08B4B5]">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </div>
                    <span>2. Checkout Started (Mulai Isi Form)</span>
                  </div>
                  <span className="font-mono text-slate-900">{started.toLocaleString('id-ID')} user ({startedPct}%)</span>
                </div>
                <div className="h-8 bg-slate-100 rounded-xl overflow-hidden p-1 flex">
                  <div 
                    className="h-full bg-[#079b9c] rounded-lg transition-all duration-500 flex items-center px-3 text-[11px] font-bold text-white min-w-[3rem]"
                    style={{ width: `${Math.max(startedPct, 4)}%` }}
                  >
                    {startedPct}%
                  </div>
                </div>
              </div>

              {/* Step 3: Checkout Completed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </div>
                    <span>3. Checkout Completed (Pembayaran Lunas)</span>
                  </div>
                  <span className="font-mono text-slate-900">{completed.toLocaleString('id-ID')} order ({completedPct}%)</span>
                </div>
                <div className="h-8 bg-slate-100 rounded-xl overflow-hidden p-1 flex">
                  <div 
                    className="h-full bg-emerald-500 rounded-lg transition-all duration-500 flex items-center px-3 text-[11px] font-bold text-white min-w-[3rem]"
                    style={{ width: `${Math.max(completedPct, 4)}%` }}
                  >
                    {completedPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel Dropoff Insight */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900">Rasio Penyelesaian Checkout</span>
                <p className="text-slate-500 text-[11px]">
                  Dari mereka yang mulai mengisi form checkout, {checkoutConversionPct}% berhasil menyelesaikan pembayaran.
                </p>
              </div>
              <div className="font-mono text-base font-black text-[#08B4B5] self-start sm:self-auto">
                {checkoutConversionPct}% Selesai
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
