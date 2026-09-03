'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  TicketPercent,
  Plus,
  Loader2,
  Calendar,
  Layers,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
  event?: { id: string; title: string } | null;
}

interface EventOption {
  id: string;
  title: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    usageLimit: '',
    maxDiscountAmount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eventId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vouchersRes, eventsRes] = await Promise.all([
        apiClient.get('/organizer/vouchers'),
        apiClient.get('/organizer/events'),
      ]);
      setVouchers(vouchersRes.data?.data || vouchersRes.data || []);
      setEvents(eventsRes.data?.data || eventsRes.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setSubmitting(true);
      const payload: any = {
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
      if (form.eventId) payload.eventId = form.eventId;

      await apiClient.post('/organizer/vouchers', payload);
      setSuccessMsg('Voucher baru berhasil dibuat!');
      setIsOpen(false);
      setForm({
        code: '',
        type: 'percentage',
        value: 10,
        usageLimit: '',
        maxDiscountAmount: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eventId: '',
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan voucher ini?')) return;
    try {
      await apiClient.post(`/organizer/vouchers/${id}/deactivate`);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menonaktifkan voucher');
    }
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const breadcrumbs = [
    { label: 'Pemasaran' },
    { label: 'Manajemen Voucher' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <TicketPercent className="h-6 w-6 text-[#08B4B5]" />
            Manajemen Voucher & Promo
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Buat kode diskon promo yang dapat digunakan lintas event (organisasi) atau khusus event tertentu.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
            <Plus className="h-4 w-4" />
            <span>Buat Voucher Baru</span>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-[#08B4B5]" />
                Tambah Voucher Baru
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Kode Voucher (Unik) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MISAL: DISKON50K"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-[#08B4B5] focus:bg-white focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Tipe Diskon</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nilai ({form.type === 'percentage' ? '%' : 'Rp'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {form.type === 'percentage' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Maksimum Potongan (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 50000 (Kosongkan jika unlimited)"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Batas Kuota Penggunaan (Opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Contoh: 100 (Kosongkan jika tanpa batas)"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Lingkup Berlaku
                </label>
                <select
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">Berlaku Lintas Semua Event (Org-Wide)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      Khusus Event: {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Berlaku Dari</label>
                  <input
                    type="date"
                    required
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Hingga</label>
                  <input
                    type="date"
                    required
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan & Terbitkan Voucher'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md shadow-xs">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari kode voucher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-full"
        />
      </div>

      {/* Voucher List */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <TicketPercent className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Voucher</h3>
          <p className="text-slate-400 text-xs mt-1">
            Buat kode voucher diskon pertama Anda untuk meningkatkan konversi penjualan tiket.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVouchers.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-mono font-black text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-lg border border-[#08B4B5]/30">
                      {v.code}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      v.status === 'active'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Potongan Diskon:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {v.type === 'percentage'
                        ? `${v.value}%`
                        : `Rp ${v.value.toLocaleString('id-ID')}`}
                      {v.maxDiscountAmount && (
                        <span className="text-[10px] text-slate-400 block text-right font-normal">
                          (maks Rp {v.maxDiscountAmount.toLocaleString('id-ID')})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Penggunaan:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {v.usageCount} / {v.usageLimit ? v.usageLimit : '∞'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Lingkup Event:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                      {v.event ? v.event.title : 'Semua Event (Org-wide)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-slate-400 font-mono">
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
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleDeactivate(v.id)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
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
