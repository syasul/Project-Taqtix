'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  TicketPercent,
  Plus,
  Loader2,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface VoucherItem {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number | null;
  usageCount: number;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'inactive' | 'expired';
}

export default function EventVouchersPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 15,
    usageLimit: '',
    maxDiscountAmount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/vouchers?eventId=${eventId}`);
      setVouchers(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat voucher event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchVouchers();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      const payload: any = {
        eventId,
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil + 'T23:59:59').toISOString(),
      };
      if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
      if (form.maxDiscountAmount && form.type === 'percentage') {
        payload.maxDiscountAmount = Number(form.maxDiscountAmount);
      }

      await apiClient.post('/organizer/vouchers', payload);
      setSuccessMsg('Voucher khusus event berhasil dibuat!');
      setIsOpen(false);
      setForm({
        code: '',
        type: 'percentage',
        value: 15,
        usageLimit: '',
        maxDiscountAmount: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      fetchVouchers();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Nonaktifkan voucher ini?')) return;
    try {
      await apiClient.post(`/organizer/vouchers/${id}/deactivate`);
      fetchVouchers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <TicketPercent className="h-6 w-6" />
            </div>
            Voucher Khusus Event
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kode promo diskon yang khusus berlaku untuk transaksi pada event ini.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer">
            <Plus className="h-4 w-4" />
            Buat Voucher Event
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-indigo-400" />
                Tambah Voucher Khusus Event
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Kode Voucher (Unik)
                </label>
                <input
                  type="text"
                  required
                  placeholder="MISAL: EARLYVIP20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tipe Diskon</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nilai ({form.type === 'percentage' ? '%' : 'Rp'})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {form.type === 'percentage' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Maksimum Potongan (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 50000"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Batas Kuota Penggunaan (Opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Kosongkan jika tanpa batas"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Berlaku Dari</label>
                  <input
                    type="date"
                    required
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Hingga</label>
                  <input
                    type="date"
                    required
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Voucher'}
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

      {/* List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <TicketPercent className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Belum Ada Voucher Khusus Event</h3>
          <p className="text-slate-500 text-xs mt-1">
            Buat kode diskon untuk promosi khusus event ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 hover:border-slate-750 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {v.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      v.status === 'active'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Potongan Diskon:</span>
                    <span className="font-bold text-slate-200">
                      {v.type === 'percentage'
                        ? `${v.value}%`
                        : `Rp ${v.value.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Penggunaan:</span>
                    <span className="font-semibold text-slate-300">
                      {v.usageCount} / {v.usageLimit ? v.usageLimit : '∞'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Masa Berlaku:
                    </span>
                    <span>
                      {new Date(v.validUntil).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {v.status === 'active' && (
                <div className="pt-4 mt-4 border-t border-slate-850">
                  <button
                    onClick={() => handleDeactivate(v.id)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    Nonaktifkan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
