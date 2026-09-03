'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
  const router = useRouter();
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

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Buku Kas Event' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Banknote className="h-6 w-6 text-[#08B4B5]" />
            Buku Kas Event (Cash Tracker)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Catat dan pantau seluruh uang tunai yang diterima kasir atau panitia di lokasi acara.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              Catat Kas Masuk
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-[#08B4B5]" />
                  Catat Transaksi Kas Masuk
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleRecordCash} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Kategori Penerimaan *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="ticket_sale">Penjualan Tiket Tunai (Ticket Sale)</option>
                    <option value="facility_sale">Penjualan Merchandise / Add-on</option>
                    <option value="other">Penerimaan Lainnya / Sponsor On-site</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nominal Tunai (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold text-base focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kasir Gate 1 - Sesi Siang"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Transaksi Kas'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Kas Tunai
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                Rp {data.totalCash.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dari Tiket (Cash)
              </span>
              <p className="text-xl font-bold text-slate-900 mt-2 font-mono">
                Rp {data.byType.ticketSales.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dari Fasilitas / Add-on
              </span>
              <p className="text-xl font-bold text-slate-900 mt-2 font-mono">
                Rp {data.byType.facilitySales.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lainnya / Sponsor
              </span>
              <p className="text-xl font-bold text-slate-900 mt-2 font-mono">
                Rp {data.byType.other.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#08B4B5]" />
                Histori Transaksi Kas Masuk
              </h3>
            </div>

            {data.transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada transaksi kas tunai yang tercatat pada event ini.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Waktu</th>
                      <th className="py-3.5 px-5">Kategori</th>
                      <th className="py-3.5 px-5">Catatan / Keterangan</th>
                      <th className="py-3.5 px-5">Dicatat Oleh</th>
                      <th className="py-3.5 px-5 text-right">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5 text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-800">
                          {tx.note || <span className="text-slate-400">-</span>}
                          {tx.relatedPosTransactionId && (
                            <span className="text-[10px] text-[#08B4B5] font-mono block">
                              POS Ref: #{tx.relatedPosTransactionId.substring(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-mono">
                          {tx.recorder?.email || 'System'}
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-emerald-600 font-mono">
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
