'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, DollarSign, Ticket, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EventTabs from '@/components/layout/event-tabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
    'Kapasitas Kuota': cat.quota,
    'Tiket Terjual': cat.sold,
  }));

  const isLoading = statsLoading || categoriesLoading;

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Statistik Penjualan' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Pendapatan
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {stats?.totalRevenue.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Transaksi sukses lunas</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tiket Terjual
                </CardTitle>
                <div className="p-2 bg-teal-50 rounded-xl text-[#08B4B5]">
                  <Ticket className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {stats?.ticketsSold} Lembar
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Tiket terkonfirmasi</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Transaksi Sukses
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {stats?.completedTransactions}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Invoice terbayar</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Transaksi Pending
                </CardTitle>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {stats?.pendingTransactions}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Menunggu bayar (15m limit)</p>
              </CardContent>
            </Card>
          </div>

          {/* Recharts Graphical Analysis */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-bold text-slate-900">
                Grafik Penjualan Tiket per Kategori
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Perbandingan kapasitas kuota maksimum dengan jumlah tiket terjual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Tidak ada data grafik kategori tiket.
                </div>
              ) : (
                <div className="h-80 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          color: '#0f172a',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="Kapasitas Kuota" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Tiket Terjual" fill="#08B4B5" radius={[6, 6, 0, 0]} />
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
