'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, DollarSign, Ticket, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EventTabs from '@/components/layout/event-tabs';

interface DashboardStats {
  eventId: string;
  totalRevenue: number;
  ticketsSold: number;
  completedTransactions: number;
  pendingTransactions: number;
}

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

export default function SalesDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  // 1. Fetch Dashboard Stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['event-dashboard-stats', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/dashboard`);
      return res.data?.data as DashboardStats;
    },
    enabled: !!eventId,
  });

  // 2. Fetch Ticket Categories for Chart Data
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/ticket-categories`);
      return res.data?.data as TicketCategory[];
    },
    enabled: !!eventId,
  });

  const stats = statsResponse;
  const categories = categoriesResponse || [];

  const chartData = categories.map((cat) => ({
    name: cat.name,
    'Kapasitas': cat.quota,
    'Terjual': cat.sold,
  }));

  const isLoading = statsLoading || categoriesLoading;

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-slate-850">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Pendapatan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-200 font-mono">
                  {stats?.totalRevenue.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Dari transaksi berstatus sukses</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-850">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tiket Terjual
                </CardTitle>
                <Ticket className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-200 font-mono">
                  {stats?.ticketsSold}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Lembar tiket terkonfirmasi</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-855">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-505 uppercase tracking-wider">
                  Transaksi Sukses
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-200 font-mono">
                  {stats?.completedTransactions}
                </div>
                <p className="text-[10px] text-slate-505 mt-1">Invoice terbayar lunas</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-855">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-505 uppercase tracking-wider">
                  Transaksi Pending
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-200 font-mono">
                  {stats?.pendingTransactions}
                </div>
                <p className="text-[10px] text-slate-505 mt-1">Menunggu pembayaran (15m limit)</p>
              </CardContent>
            </Card>
          </div>

          {/* Recharts Graphical Analysis */}
          <Card className="bg-slate-900/40 border-slate-855">
            <CardHeader className="border-b border-slate-855 pb-4">
              <CardTitle className="text-md font-bold text-slate-200">
                Grafik Penjualan Tiket per Kategori
              </CardTitle>
              <CardDescription className="text-xs text-slate-450">
                Perbandingan kapasitas kuota maksimum dengan jumlah tiket terjual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Tidak ada data grafik kategori tiket.
                </div>
              ) : (
                <div className="h-80 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#f1f5f9',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="Kapasitas" fill="#312e81" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Terjual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
