'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  PlusCircle, 
  DollarSign, 
  Percent, 
  HeartHandshake, 
  Loader2, 
  X,
  ArrowRight,
  Sparkles,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function GrowthMarketingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channel, setChannel] = useState('meta_ads');
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: growthResponse, isLoading, refetch } = useQuery({
    queryKey: ['growth-dashboard', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/growth-dashboard`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const growth = growthResponse || { channels: [], topAffiliates: [] };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Identify highest ROAS channel
  const highestRoas = (growth.channels || []).reduce((max: number, curr: any) => {
    return (curr.roas !== null && curr.roas > max) ? curr.roas : max;
  }, 0);

  const handleAddSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !periodStart || !periodEnd) return;

    try {
      setSaving(true);
      const res = await apiClient.post(`/organizer/events/${eventId}/ad-spend`, {
        channel,
        amount: parseFloat(amount),
        periodStart,
        periodEnd,
      });

      if (res.data?.success) {
        toast.success('Pengeluaran iklan berhasil dicatat');
        setIsModalOpen(false);
        setAmount('');
        setPeriodStart('');
        setPeriodEnd('');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat pengeluaran iklan');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Growth Marketing & ROAS' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#08B4B5]" />
            Growth Marketing & ROAS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau efektivitas pengembalian biaya iklan (ROAS) per kanal promosi dan performa affiliate partner.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Catat Pengeluaran Iklan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis growth...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ROAS Channels Table */}
          <Card className="bg-white border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Kinerja Iklan Paid Ads (ROAS)</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Return on Ad Spend dihitung dari omzet penjualan tiket dibagi biaya iklan terekam
                </CardDescription>
              </div>
              <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 uppercase font-mono self-start sm:self-auto">
                ROAS Target &gt; 2.0x
              </span>
            </div>

            {growth.channels.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada pengeluaran iklan dicatat untuk event ini. Klik tombol &quot;Catat Pengeluaran Iklan&quot; di atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Pemasaran Channel</th>
                      <th className="pb-3 text-right">Biaya Iklan (Spend)</th>
                      <th className="pb-3 text-right">Omzet Hasil (Revenue)</th>
                      <th className="pb-3 text-right">Kinerja (ROAS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {growth.channels.map((ch: any) => {
                      const isTopChannel = ch.roas !== null && ch.roas === highestRoas && ch.roas > 0;
                      return (
                        <tr key={ch.channel} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 flex items-center gap-2">
                            <span className="font-bold text-slate-900 capitalize">
                              {ch.channel.replace(/_/g, ' ')}
                            </span>
                            {isTopChannel && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Top ROAS
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-500">
                            {ch.spend > 0 ? formatRupiah(ch.spend) : 'Rp 0'}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-900 font-bold">
                            {formatRupiah(ch.revenue)}
                          </td>
                          <td className="py-3 text-right">
                            {ch.roas !== null ? (
                              <span
                                className={cn(
                                  "inline-flex px-2.5 py-1 border font-mono font-bold rounded-lg text-xs",
                                  ch.roas >= 2
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-300 shadow-2xs font-black"
                                    : ch.roas >= 1
                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                    : "text-rose-700 bg-rose-50 border-rose-200"
                                )}
                              >
                                {Number(ch.roas).toFixed(2)}x ROAS
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Belum ada data spend
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Affiliates Leaderboard (Top 5) */}
          <Card className="bg-white border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-[#08B4B5] rounded-xl">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Leaderboard Affiliate Partner</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Peringkat 5 teratas partner afiliasi dengan sumbangsih penjualan terbesar
                  </CardDescription>
                </div>
              </div>
              <Link
                href={`/dashboard/events/${eventId}/partners`}
                className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1"
              >
                Lihat semua partner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {growth.topAffiliates.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada penjualan partner terekam untuk event ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {growth.topAffiliates.slice(0, 5).map((aff: any, idx: number) => (
                  <div 
                    key={aff.partnerId} 
                    className="flex items-center justify-between p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "h-6 w-6 font-bold rounded-lg flex items-center justify-center text-xs",
                        idx === 0 ? "bg-amber-100 text-amber-800" :
                        idx === 1 ? "bg-slate-200 text-slate-700" :
                        idx === 2 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-white border border-slate-200 text-slate-500"
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{aff.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Konversi: {((aff.conversionRate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-600 font-mono font-bold">
                        {formatRupiah(aff.revenue)}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {aff.salesCount || aff.conversions || 0} Tiket
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Ad Spend Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#08B4B5]" />
                Catat Pengeluaran Iklan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpend} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Marketing Channel *</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                >
                  <option value="meta_ads">Meta Ads (Facebook / Instagram)</option>
                  <option value="tiktok_ads">TikTok Ads</option>
                  <option value="google_ads">Google Ads (Search / YouTube)</option>
                  <option value="kol_endorse">KOL / Influencer Endorsement</option>
                  <option value="other">Kanal Promosi Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah Biaya Spend (Rp) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Misal: 5000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm border-0"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Catatan Spend</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
