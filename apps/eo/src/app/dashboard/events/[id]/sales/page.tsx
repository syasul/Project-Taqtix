'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  DollarSign,
  Ticket,
  Activity,
  TrendingUp,
  HeartHandshake,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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

interface Partner {
  id: string;
  name: string;
  uniqueCode: string;
  promoCode?: string;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
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

  // 3. Fetch Partners for Affiliate Commission Deductions
  const { data: partnersResponse } = useQuery({
    queryKey: ['event-partners-deductions', eventId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/organizer/events/${eventId}/partners`);
        return (res.data?.data || res.data || []) as Partner[];
      } catch {
        return [] as Partner[];
      }
    },
    enabled: !!eventId,
  });

  const stats = statsResponse;
  const categories = categoriesResponse || [];
  const partners = partnersResponse || [];

  const totalAffiliateDeductions = partners.reduce(
    (sum, p) => sum + (p.commissionEarned || 0),
    0
  );
  const totalAffiliateConversions = partners.reduce(
    (sum, p) => sum + (p.conversions || 0),
    0
  );

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
          {/* PEMBERITAHUAN POTONGAN AFFILIATE (Requirement 5) */}
          {totalAffiliateDeductions > 0 ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    Pemberitahuan: Ada Potongan Komisi Affiliate
                  </h4>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    Terdapat potongan komisi partner afiliasi sebesar{' '}
                    <strong className="font-mono font-bold text-amber-950">
                      {totalAffiliateDeductions.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </strong>{' '}
                    dari total <strong className="font-bold">{totalAffiliateConversions} tiket</strong> yang
                    berhasil terjual melalui referral/kode promo afiliasi. Dana ini akan dipotong saat settlement pencairan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/events/${eventId}/partners`)}
                className="px-3.5 py-1.5 bg-amber-200/80 hover:bg-amber-300/80 text-amber-900 font-bold rounded-xl whitespace-nowrap transition cursor-pointer self-end sm:self-auto"
              >
                Lihat Leaderboard
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-[#08B4B5] shrink-0" />
              <span>
                Belum ada potongan komisi affiliate pada event ini. Anda dapat mengundang partner afiliasi untuk mempercepat penjualan tiket.
              </span>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="text-lg font-extrabold text-slate-900 font-mono">
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
                  Potongan Komisi
                </CardTitle>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <HeartHandshake className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-extrabold text-amber-700 font-mono">
                  {totalAffiliateDeductions.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[10px] text-amber-600 font-medium mt-1">
                  {totalAffiliateConversions} tiket via affiliate
                </p>
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
                <div className="text-lg font-extrabold text-slate-900 font-mono">
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
                <div className="text-lg font-extrabold text-slate-900 font-mono">
                  {stats?.completedTransactions}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Invoice terbayar</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pending Bayar
                </CardTitle>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-extrabold text-slate-900 font-mono">
                  {stats?.pendingTransactions}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Batas waktu 15 menit</p>
              </CardContent>
            </Card>
          </div>

          {/* Rincian Potongan Komisi Affiliate jika ada */}
          {partners.length > 0 && totalAffiliateDeductions > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#08B4B5]" />
                  Rincian Pemotongan Komisi Partner Afiliasi
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Daftar komisi per affiliate yang timbul dari pembelian tiket menggunakan kode promo/link mitra.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Nama Partner</th>
                        <th className="py-3 px-4">Kode Promo / Referral</th>
                        <th className="py-3 px-4">Tiket Terjual</th>
                        <th className="py-3 px-4">Omset Dihasilkan</th>
                        <th className="py-3 px-4 text-right">Potongan Komisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partners.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-[#08B4B5] bg-[#08B4B5]/10 px-2 py-0.5 rounded-md">
                              {p.promoCode || p.uniqueCode}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {p.conversions} lembar
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {p.revenueGenerated.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 text-right">
                            {p.commissionEarned.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

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
