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
  ResponsiveContainer 
} from 'recharts';
import { Loader2, Users, MapPin, Award, Activity } from 'lucide-react';

const COLORS = ['#08B4B5', '#64748b'];

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
  };

  const chartData = [
    { name: 'Buyer Baru', value: audience.newBuyers },
    { name: 'Buyer Lama (Returning)', value: audience.returningBuyers },
  ];

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Analisis Profil Audiens' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#08B4B5]" />
          Analisis Profil Audiens
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Dapatkan gambaran retensi pembeli berulang dan peta sebaran kota asal pembeli.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis audiens...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Retention Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Buyer Unik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {audience.totalBuyers} Orang
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Jumlah email/kontak unik terdaftar</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Loyalty (Repeat Buyer)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-[#08B4B5] font-mono">
                  {audience.returningBuyers} Orang
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pembeli yang sudah beli event Anda sebelumnya</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Repeat Purchase Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {(audience.repeatPurchaseRate * 100).toFixed(0)}%
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Rasio loyalitas audiens organizer Anda</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retention Donut */}
            <Card className="bg-white border-slate-200 p-6 flex flex-col justify-between rounded-2xl shadow-sm">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Rasio Buyer Baru vs Lama</CardTitle>
                <CardDescription className="text-xs text-slate-400">Rasio retensi basis audiens acara</CardDescription>
              </div>

              {audience.totalBuyers === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                  Belum ada data retensi.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6 mt-6">
                  <div className="h-44 w-44 shrink-0 font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    {chartData.map((item, idx) => (
                      <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                          <span className="text-xs text-slate-700 font-semibold">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {item.value} ({((item.value / audience.totalBuyers) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Top Cities */}
            <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">5 Kota Teratas Pembeli</CardTitle>
                <CardDescription className="text-xs text-slate-400">Sebaran wilayah pembeli tiket terbanyak</CardDescription>
              </div>

              <div className="space-y-3">
                {audience.topCities.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Belum ada data geografi terisi dari checkout pembeli.
                  </div>
                ) : (
                  audience.topCities.map((cityData: any, idx: number) => (
                    <div key={cityData.city} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] font-bold rounded-lg flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-900 font-bold capitalize">{cityData.city}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-mono font-bold">
                        {cityData.count} Pembeli
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
