'use client';

import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      toast.error('Gagal mencatat pengeluaran iklan');
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
            Pantau pengembalian biaya iklan (ROAS) per channel dan performa konversi affiliate partner.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0"
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
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Kinerja Iklan Paid Ads (ROAS)</CardTitle>
              <CardDescription className="text-xs text-slate-400">Perbandingan biaya iklan dengan omzet tiket yang dikonversi</CardDescription>
            </div>

            {growth.channels.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada pengeluaran iklan dicatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Pemasaran Channel</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Biaya Iklan (Spend)</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Omzet Hasil (Revenue)</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Kinerja (ROAS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {growth.channels.map((ch: any) => (
                      <tr key={ch.channel} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-bold text-slate-900 capitalize">{ch.channel.replace('_', ' ')}</td>
                        <td className="p-3 font-mono text-slate-500">{formatRupiah(ch.spend)}</td>
                        <td className="p-3 font-mono text-slate-900 font-bold">{formatRupiah(ch.revenue)}</td>
                        <td className="p-3">
                          {ch.roas !== null ? (
                            <span className={`inline-flex px-2 py-0.5 border font-mono font-bold rounded-lg ${
                              ch.roas >= 3 
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                                : ch.roas >= 1 
                                ? "text-amber-700 bg-amber-50 border-amber-200" 
                                : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}>
                              {ch.roas}x ROAS
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Affiliates Leaderboard */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-[#08B4B5]" />
              <CardTitle className="text-sm font-bold text-slate-900">Leaderboard Affiliate Partner</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">Peringkat 5 teratas partner afiliasi dengan sumbangsih penjualan terbesar</CardDescription>

            {growth.topAffiliates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada penjualan partner terekam.
              </div>
            ) : (
              <div className="space-y-3">
                {growth.topAffiliates.map((aff: any, idx: number) => (
                  <div key={aff.partnerId} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] font-bold rounded-lg flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{aff.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">Conversion: {(aff.conversionRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-mono font-bold">
                      {formatRupiah(aff.revenue)}
                    </span>
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
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                  <option value="meta_ads">Meta Ads (FB/IG)</option>
                  <option value="tiktok_ads">TikTok Ads</option>
                  <option value="google_ads">Google Ads (YouTube/Search)</option>
                  <option value="other">Other / Offline Ads</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah Biaya (Rp) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Masukkan nominal Rupiah"
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

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
