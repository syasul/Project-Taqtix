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
  Sparkles,
  ShoppingBag,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

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
  partner?: { name: string; uniqueCode: string } | null;
}

interface EventOption {
  id: string;
  title: string;
}

interface PartnerOption {
  id: string;
  name: string;
  uniqueCode: string;
  promoCode?: string;
  conversions?: number;
  revenueGenerated?: number;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      const eventList = eventsRes.data?.data || eventsRes.data || [];
      setEvents(eventList);

      // Fetch partners for first few events if any
      if (eventList.length > 0) {
        try {
          const partnersRes = await apiClient.get(
            `/organizer/events/${eventList[0].id}/partners`
          );
          setPartners(partnersRes.data?.data || partnersRes.data || []);
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'EO-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, code });
    toast.success('Kode promo acak berhasil digenerate');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Voucher baru berhasil dibuat!');
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
      toast.error(err?.response?.data?.message || 'Gagal membuat voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan voucher ini?')) return;
    try {
      await apiClient.post(`/organizer/vouchers/${id}/deactivate`);
      toast.success('Voucher berhasil dinonaktifkan');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menonaktifkan voucher');
    }
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to find affiliate linked to this voucher code
  const getLinkedPartner = (voucherCode: string) => {
    return partners.find(
      (p) =>
        p.promoCode?.toUpperCase() === voucherCode.toUpperCase() ||
        p.uniqueCode?.toUpperCase() === voucherCode.toUpperCase()
    );
  };

  const breadcrumbs = [{ label: 'Pemasaran' }, { label: 'Manajemen Voucher & Promo' }];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TicketPercent className="w-6 h-6 text-[#08B4B5]" />
            Manajemen Voucher & Promo EO
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Buat kode diskon promosi untuk meningkatkan penjualan tiket. Pantau siapa affiliator yang menjual dan total tiket yang terjual.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Voucher Baru</span>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-[#08B4B5]" />
                Buat Voucher / Kode Promo
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Kode Promo *</label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[#08B4B5] hover:text-[#079b9c] font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Otomatis</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: MERDEKA20"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800 font-mono font-bold uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Diskon</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nilai Diskon {form.type === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batas Kuota Penggunaan</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Contoh: 100 (Opsional)"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Berlaku untuk Event</label>
                  <select
                    value={form.eventId}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  >
                    <option value="">Semua Event Saya</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mulai Berlaku</label>
                  <input
                    type="date"
                    required
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Berakhir Pada</label>
                  <input
                    type="date"
                    required
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Terbitkan Voucher</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari kode voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat daftar voucher...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Belum ada voucher yang dibuat. Klik "Buat Voucher Baru" di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Kode Voucher</th>
                  <th className="py-3.5 px-4">Diskon</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Affiliate Penjual</th>
                  <th className="py-3.5 px-4">Terjual (Penggunaan)</th>
                  <th className="py-3.5 px-4">Masa Berlaku</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => {
                  const linkedPartner = getLinkedPartner(v.code);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#08B4B5] bg-[#08B4B5]/10 px-2.5 py-1 rounded-lg border border-[#08B4B5]/20">
                          {v.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {v.type === 'percentage'
                          ? `${v.value}%`
                          : v.value.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {v.event?.title || 'Semua Event Saya'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {linkedPartner ? (
                          <div>
                            <p className="font-bold text-slate-900">{linkedPartner.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {linkedPartner.uniqueCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Promo EO Langsung</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {v.usageCount} {v.usageLimit ? `/ ${v.usageLimit}` : 'kali'}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {v.usageCount} tiket terjual
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(v.validUntil).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {v.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {v.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(v.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Nonaktifkan Voucher"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
