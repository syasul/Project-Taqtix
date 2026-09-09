'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Loader2, 
  Users, 
  UserPlus, 
  UserCheck, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Percent 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AudienceAnalyticsPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['audience-analytics', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/analytics/audience`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const audience = analyticsResponse || {
    totalBuyers: 0,
    newBuyers: 0,
    returningBuyers: 0,
    topCities: [],
    repeatPurchaseRate: 0,
    repeatRateTrend: '+4.2%', // Indicator versus previous event if available
  };

  const citiesData = (audience.topCities || []).map((c: any) => ({
    city: c.city || 'Kota Lainnya',
    buyers: c.count || c.buyers || 0,
  }));

  const newBuyersPct = audience.totalBuyers > 0 
    ? Math.round((audience.newBuyers / audience.totalBuyers) * 100) 
    : 0;

  const returningBuyersPct = audience.totalBuyers > 0 
    ? Math.round((audience.returningBuyers / audience.totalBuyers) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#08B4B5]" />
          Laporan Demografi & Loyalitas Audiens
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Analisis perbandingan pembeli baru versus pelanggan setia, sebaran geografis kota, dan tingkat pembelian ulang.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Menganalisis audiens event...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: New Buyers */}
            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pembeli Baru (New)</span>
                <div className="p-2 bg-teal-50 text-[#08B4B5] rounded-xl">
                  <UserPlus className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {audience.newBuyers.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {newBuyersPct}% dari total {audience.totalBuyers} pembeli
              </p>
            </Card>

            {/* Card 2: Returning Buyers */}
            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Returning Buyers</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {audience.returningBuyers.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {returningBuyersPct}% pernah beli event sebelumnya
              </p>
            </Card>

            {/* Card 3: Repeat Purchase Rate with Trend Indicator */}
            <Card className="bg-white border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repeat Purchase Rate</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-2">
                <span>{audience.repeatPurchaseRate}%</span>
                {audience.repeatPurchaseRate >= 15 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 font-sans">
                    <TrendingUp className="h-3 w-3" />
                    Tinggi
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-0.5 font-sans">
                    Normal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600 inline" />
                Loyalitas audiens ekosistem Anda
              </p>
            </Card>
          </div>

          {/* Top Cities Horizontal Bar Chart */}
          <Card className="bg-white border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <MapPin className="h-4 w-4 text-[#08B4B5]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Sebaran Asal Kota Terbanyak (Top Cities)</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Kota asal pembeli tiket terverifikasi berdasarkan invoice & checkout data
                  </CardDescription>
                </div>
              </div>
            </div>

            {citiesData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                Belum ada data domisili kota pembeli tiket yang terekam.
              </div>
            ) : (
              <div className="h-64 w-full text-xs font-mono pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={citiesData} 
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="city" 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      formatter={(value: any) => [`${value} Pembeli`, 'Total']}
                    />
                    <Bar dataKey="buyers" fill="#08B4B5" radius={[0, 6, 6, 0]} />
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
