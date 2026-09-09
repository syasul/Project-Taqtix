'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  MousePointerClick, 
  CheckCircle2, 
  DollarSign, 
  Copy, 
  LogOut, 
  Loader2,
  Trophy,
  CreditCard,
  ExternalLink,
  Sparkles,
  Receipt,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIdempotency } from '@/hooks/use-idempotency';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PayoutItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  bankAccount?: string;
}

interface PartnerStats {
  partnerId: string;
  name: string;
  uniqueCode: string;
  uniqueLink?: string;
  eventName: string;
  eventSlug: string;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  commissionPct: number;
  ranking?: number;
  totalPartners?: number;
  recentSales: Array<{
    orderId: string;
    amount: number;
    date: string;
  }>;
  payoutHistory?: PayoutItem[];
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable Idempotency Key & Debounce Guards
  const { idempotencyKey, refreshKey } = useIdempotency();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const lastActionTimeRef = React.useRef(0);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/partner/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      toast.error('Sesi Anda berakhir atau Anda bukan partner resmi');
      logout();
      router.push('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGenerateCode = async () => {
    // 500ms debounce & immediate lock
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500) return;
    if (isGeneratingCode) return;

    lastActionTimeRef.current = now;
    setIsGeneratingCode(true);

    try {
      const res = await apiClient.post(
        '/affiliate/me/generate-code',
        {},
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );
      if (res.data?.success) {
        toast.success('Kode afiliasi baru berhasil di-generate!');
        refreshKey();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal meng-generate kode afiliasi baru',
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleRequestPayout = async () => {
    // 500ms debounce & immediate lock
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500) return;
    if (isRequestingPayout) return;

    lastActionTimeRef.current = now;
    setIsRequestingPayout(true);

    try {
      const res = await apiClient.post(
        '/affiliate/me/payout-requests',
        {},
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );
      if (res.data?.success) {
        toast.success('Permintaan pencairan komisi berhasil diajukan!');
        refreshKey();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal mengajukan pencairan komisi',
      );
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Construct complete referral link
  const completeLink = stats?.uniqueLink || (typeof window !== 'undefined' 
    ? `${window.location.origin}/event/${stats?.eventSlug}?ref=${stats?.uniqueCode}` 
    : `https://taqtix.id/event/${stats?.eventSlug}?ref=${stats?.uniqueCode}`);

  const handleCopyLink = () => {
    if (!completeLink) return;
    navigator.clipboard.writeText(completeLink);
    toast.success('Link referral lengkap disalin ke clipboard!');
  };

  const handleLogout = () => {
    logout();
    router.push('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Memuat dashboard partner...</span>
      </div>
    );
  }

  // Generate chart points from recent sales
  const salesChartData = (stats?.recentSales || []).map((sale, idx) => ({
    name: new Date(sale.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    sales: sale.amount,
  })).reverse();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Streamlined Partner Header (Clean, separate from EO complex sidebar) */}
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-[#08B4B5]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white">Portal Mitra Afiliasi</h1>
              <p className="text-[10px] text-slate-400">TAQtix Partner Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-bold hidden sm:inline">
              {stats?.name}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="rounded-xl border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Event Banner & Greeting */}
        <div className="p-6 bg-slate-800/80 border border-slate-700/80 rounded-3xl space-y-2 shadow-xl">
          <span className="text-[10px] font-bold text-[#08B4B5] uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full inline-block">
            Event Aktif Mitra
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {stats?.eventName}
          </h2>
          <p className="text-xs text-slate-400">
            Sebarkan tautan unik Anda ke audiens dan dapatkan komisi sebesar{' '}
            <strong className="text-white font-bold">{stats?.commissionPct}%</strong> untuk setiap tiket yang berhasil terjual.
          </p>
        </div>

        {/* 1. KARTU "MY LINK" dengan Tombol Copy Tautan Lengkap */}
        <Card className="bg-slate-800 border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-[#08B4B5]" />
              MY LINK (Tautan Referral Lengkap)
            </CardTitle>
            <span className="text-[10px] font-mono font-bold text-[#08B4B5] bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
              Kode: {stats?.uniqueCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-mono text-slate-200 truncate select-all">
              {completeLink}
            </div>
            <Button
              onClick={handleCopyLink}
              className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-2xl px-5 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md h-auto shrink-0"
            >
              <Copy className="h-4 w-4" />
              <span>Salin Link Referral</span>
            </Button>
            <Button
              onClick={handleGenerateCode}
              disabled={isGeneratingCode}
              variant="outline"
              className="border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-200 rounded-2xl px-4 py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer h-auto shrink-0"
            >
              {isGeneratingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#08B4B5]" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#08B4B5]" />
                  <span>Generate Kode</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            Setiap pembeli yang mengakses dan bertransaksi melalui link ini akan teratribusi otomatis ke akun Anda.
          </p>
        </Card>

        {/* Stat Cards Grid: MY COMMISSION, MY RANKING, CLICKS & CONVERSIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 2. KARTU MY COMMISSION */}
          <Card className="bg-slate-800 border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MY COMMISSION</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatRupiah(stats?.commissionEarned || 0)}
            </div>
            <div className="pt-2 flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-400">Bagi hasil komisi bersih</p>
              <Button
                size="sm"
                onClick={handleRequestPayout}
                disabled={isRequestingPayout || (stats?.commissionEarned || 0) <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer h-auto shadow-xs disabled:opacity-40"
              >
                {isRequestingPayout ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3" />
                    <span>Request Pencairan</span>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 3. KARTU MY RANKING */}
          <Card className="bg-slate-800 border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MY RANKING</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300 font-sans tracking-tight">
              Peringkat {stats?.ranking || 1} dari {stats?.totalPartners || 1}
            </div>
            <p className="text-[10px] text-slate-400">Berdasarkan total omzet penjualan</p>
          </Card>

          {/* Clicks */}
          <Card className="bg-slate-800 border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL KLIK</span>
              <div className="p-2 bg-teal-500/10 text-[#08B4B5] rounded-xl">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.clicks || 0}
            </div>
            <p className="text-[10px] text-slate-400">Pengunjung via referral</p>
          </Card>

          {/* Conversions */}
          <Card className="bg-slate-800 border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TIKET TERJUAL</span>
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.conversions || 0} Tiket
            </div>
            <p className="text-[10px] text-slate-400">
              Omzet: {formatRupiah(stats?.revenueGenerated || 0)}
            </p>
          </Card>
        </div>

        {/* 4. KARTU MY SALES (Grafik Sederhana Tren Penjualan) */}
        <Card className="bg-slate-800 border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white">MY SALES (Tren Penjualan Afiliasi)</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Nilai omzet tiket yang berhasil Anda arahkan ke platform
              </CardDescription>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#08B4B5] bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              IDR Transaksi
            </span>
          </div>

          {salesChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              Belum ada penjualan tiket yang terkonversi melalui tautan Anda.
            </div>
          ) : (
            <div className="h-56 w-full text-xs font-mono pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(v) => `Rp${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }}
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Omzet']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#08B4B5" 
                    strokeWidth={3} 
                    fill="#08B4B5" 
                    fillOpacity={0.15} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* 5. TABEL MY PAYOUT HISTORY */}
        <Card className="bg-slate-800 border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#08B4B5]" />
                MY PAYOUT HISTORY (Riwayat Pencairan Komisi)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Catatan komisi yang telah ditransfer ke rekening Anda oleh promotor
              </CardDescription>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Tanggal Pencairan</th>
                  <th className="pb-3">ID Transaksi / Bank</th>
                  <th className="pb-3 text-right">Jumlah Komisi</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium text-slate-300">
                {(!stats?.payoutHistory || stats.payoutHistory.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Belum ada pencairan dana komisi yang diproses.
                    </td>
                  </tr>
                ) : (
                  stats.payoutHistory.map((payout, idx) => (
                    <tr key={idx} className="hover:bg-slate-750/30 transition">
                      <td className="py-3 font-mono text-slate-400">
                        {new Date(payout.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-white">{payout.bankAccount || 'Transfer Bank'}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{payout.id}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-400 font-mono">
                        {formatRupiah(payout.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
