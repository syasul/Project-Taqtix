'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  PlusCircle, 
  DollarSign, 
  Percent, 
  HeartHandshake, 
  Loader2, 
  X 
} from 'lucide-react';

export default function GrowthMarketingPage() {
  const params = useParams();
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

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Growth Marketing & ROAS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau pengembalian biaya iklan (ROAS) per channel dan performa konversi affiliate partner.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Catat Pengeluaran Iklan
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat analisis growth...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ROAS Channels Table */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Kinerja Iklan Paid Ads (ROAS)</CardTitle>
              <CardDescription className="text-xs text-slate-500">Perbandingan biaya iklan dengan omzet tiket yang dikonversi</CardDescription>
            </div>

            {growth.channels.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Belum ada pengeluaran iklan dicatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Pemasaran Channel</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Biaya Iklan (Spend)</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Omzet Hasil (Revenue)</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Kinerja (ROAS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {growth.channels.map((ch: any) => (
                      <tr key={ch.channel} className="hover:bg-slate-850/30 transition">
                        <td className="p-3 text-xs font-bold text-slate-200 capitalize">{ch.channel.replace('_', ' ')}</td>
                        <td className="p-3 text-xs font-mono text-slate-400">{formatRupiah(ch.spend)}</td>
                        <td className="p-3 text-xs font-mono text-slate-200 font-bold">{formatRupiah(ch.revenue)}</td>
                        <td className="p-3 text-xs">
                          {ch.roas !== null ? (
                            <span className={`inline-flex px-2 py-0.5 border font-mono font-bold rounded-lg ${
                              ch.roas >= 3 
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                : ch.roas >= 1 
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}>
                              {ch.roas}x ROAS
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
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
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-sm font-bold text-slate-200">Leaderboard Affiliate Partner</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">Peringkat 5 teratas partner afiliasi dengan sumbangsih penjualan terbesar</CardDescription>

            {growth.topAffiliates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Belum ada penjualan partner terekam.
              </div>
            ) : (
              <div className="space-y-3">
                {growth.topAffiliates.map((aff: any, idx: number) => (
                  <div key={aff.partnerId} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{aff.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">Conversion: {(aff.conversionRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono font-bold">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-500" />
                Catat Pengeluaran Iklan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpend} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Marketing Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="meta_ads">Meta Ads (FB/IG)</option>
                  <option value="tiktok_ads">TikTok Ads</option>
                  <option value="google_ads">Google Ads (YouTube/Search)</option>
                  <option value="other">Other / Offline Ads</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Jumlah Biaya (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Masukkan nominal Rupiah"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
