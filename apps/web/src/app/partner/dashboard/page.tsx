'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  MousePointerClick, 
  CheckCircle, 
  DollarSign, 
  Copy, 
  LogOut, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  partnerId: string;
  name: string;
  uniqueCode: string;
  eventName: string;
  eventSlug: string;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  commissionPct: number;
  recentSales: Array<{
    orderId: string;
    amount: number;
    date: string;
  }>;
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/partner/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      toast.error('Sesi Anda berakhir atau Anda bukan partner');
      logout();
      router.push('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleCopyLink = () => {
    if (!stats) return;
    const link = `http://localhost:3001/v1/r/${stats.uniqueCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Link referral disalin ke clipboard');
  };

  const handleLogout = () => {
    logout();
    router.push('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Memuat performa partner...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-slate-950 border-b border-slate-900 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <h1 className="text-sm font-bold tracking-tight text-slate-100">Portal Partner TAQtix</h1>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/40 border border-slate-850 rounded-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Selamat Datang, {stats?.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Event Aktif: <strong className="text-indigo-400 font-semibold">{stats?.eventName}</strong>
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            Salin Link Referral
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/40 border-slate-850">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Klik Link</CardTitle>
              <MousePointerClick className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100 font-mono">{stats?.clicks} Clicks</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-850">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konversi Penjualan</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100 font-mono">{stats?.conversions} Order</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-855">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-505 uppercase tracking-wider">Pendapatan Kotor</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100 font-mono">{formatRupiah(stats?.revenueGenerated || 0)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-855">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-505 uppercase tracking-wider">Komisi Anda ({stats?.commissionPct}%)</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-450 font-mono">{formatRupiah(stats?.commissionEarned || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent sales */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">10 Referensi Penjualan Terakhir</h3>
            <p className="text-[10px] text-slate-500 mt-1">Daftar transaksi sukses yang ter-atribut dengan link referral Anda</p>
          </div>

          {stats?.recentSales.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Belum ada penjualan terafiliasi yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/20">
                    <th className="p-3 text-xs font-bold text-slate-400 uppercase">Order ID</th>
                    <th className="p-3 text-xs font-bold text-slate-400 uppercase">Jumlah Pembelian</th>
                    <th className="p-3 text-xs font-bold text-slate-400 uppercase">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {stats?.recentSales.map((sale) => (
                    <tr key={sale.orderId} className="hover:bg-slate-850/30 transition">
                      <td className="p-3 text-xs font-mono text-slate-400">{sale.orderId}</td>
                      <td className="p-3 text-xs font-mono text-slate-200 font-bold">{formatRupiah(sale.amount)}</td>
                      <td className="p-3 text-xs font-mono text-slate-450">
                        {new Date(sale.date).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
