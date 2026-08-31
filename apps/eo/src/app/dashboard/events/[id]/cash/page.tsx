'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Banknote,
  Plus,
  Loader2,
  Coins,
  Receipt,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CashTxItem {
  id: string;
  type: 'ticket_sale' | 'facility_sale' | 'other';
  amount: number;
  note: string | null;
  relatedPosTransactionId: string | null;
  createdAt: string;
  recorder: {
    email: string;
  };
}

interface CashEventSummary {
  totalCash: number;
  byType: {
    ticketSales: number;
    facilitySales: number;
    other: number;
  };
  transactions: CashTxItem[];
}

export default function EventCashPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [data, setData] = useState<CashEventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    type: 'ticket_sale' as 'ticket_sale' | 'facility_sale' | 'other',
    amount: 50000,
    note: '',
  });

  const fetchCashData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/cash`);
      setData(res.data?.data || res.data || null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat data kas event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchCashData();
  }, [eventId]);

  const handleRecordCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      await apiClient.post(`/organizer/events/${eventId}/cash`, {
        type: form.type,
        amount: Number(form.amount),
        note: form.note.trim() || undefined,
      });

      setSuccessMsg('Penerimaan kas tunai berhasil dicatat');
      setIsOpen(false);
      setForm({ type: 'ticket_sale', amount: 50000, note: '' });
      fetchCashData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal mencatat kas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Banknote className="h-6 w-6" />
            </div>
            Buku Kas Event (Cash Tracker)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Catat dan pantau seluruh uang tunai yang diterima kasir atau panitia di lokasi acara.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer">
            <Plus className="h-4 w-4" />
            Catat Kas Masuk
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-400" />
                Catat Transaksi Kas Masuk
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleRecordCash} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Kategori Penerimaan
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ticket_sale">Penjualan Tiket Tunai (Ticket Sale)</option>
                  <option value="facility_sale">Penjualan Merchandise / Add-on</option>
                  <option value="other">Penerimaan Lainnya / Sponsor On-site</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nominal Tunai (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono text-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kasir Gate 1 - Sesi Siang"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Transaksi Kas'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Kas Tunai
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-2">
                Rp {data.totalCash.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dari Tiket (Cash)
              </span>
              <p className="text-xl font-bold text-slate-100 mt-2">
                Rp {data.byType.ticketSales.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dari Fasilitas / Add-on
              </span>
              <p className="text-xl font-bold text-slate-100 mt-2">
                Rp {data.byType.facilitySales.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lainnya / Sponsor
              </span>
              <p className="text-xl font-bold text-slate-100 mt-2">
                Rp {data.byType.other.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-850">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                Histori Transaksi Kas Masuk
              </h3>
            </div>

            {data.transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada transaksi kas tunai yang tercatat pada event ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-850 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Waktu</th>
                      <th className="py-3.5 px-5">Kategori</th>
                      <th className="py-3.5 px-5">Catatan / Keterangan</th>
                      <th className="py-3.5 px-5">Dicatat Oleh</th>
                      <th className="py-3.5 px-5 text-right">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300">
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-850/30 transition">
                        <td className="py-4 px-5 text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-200">
                          {tx.note || <span className="text-slate-600">-</span>}
                          {tx.relatedPosTransactionId && (
                            <span className="text-[10px] text-indigo-400 font-mono block">
                              POS Ref: #{tx.relatedPosTransactionId.substring(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-400 font-mono">
                          {tx.recorder?.email || 'System'}
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-emerald-400">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
