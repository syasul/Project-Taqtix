'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MockPromo } from '@/lib/api/client';
import {
  TicketPercent,
  Plus,
  Trash2,
  Search,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PromosManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MockPromo | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    usageLimit: 500,
    eventId: '',
    partnerName: '',
    partnerEmail: '',
    partnerCode: '',
  });

  // Fetch Promos
  const { data: promos = [], isLoading } = useQuery<MockPromo[]>({
    queryKey: ['admin-promos'],
    queryFn: () => api.get<MockPromo[]>('/admin/promos'),
  });

  // Fetch Events for select option
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['admin-events'],
    queryFn: () => api.get<any[]>('/admin/events'),
  });

  // Create promo mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/admin/promos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Kode promo baru berhasil diterbitkan');
    },
    onError: () => {
      toast.error('Gagal membuat kode promo');
    },
  });

  // Delete promo mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/promos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setDeleteConfirm(null);
      toast.success('Kode promo berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus kode promo');
    },
  });

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percentage',
      value: 10,
      usageLimit: 500,
      eventId: '',
      partnerName: '',
      partnerEmail: '',
      partnerCode: '',
    });
  };

  // Generate random clean alphanumeric promo code
  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = form.partnerName ? form.partnerName.slice(0, 3).toUpperCase() : 'TAQ';
    setForm({ ...form, code: `${prefix}${randomPart}` });
    toast.success('Kode promo acak berhasil digenerate');
  };

  const filteredPromos = promos.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.partnerName && p.partnerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.eventTitle && p.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalOmset = promos.reduce((sum, p) => sum + (p.grossSalesGenerated || 0), 0);
  const totalUses = promos.reduce((sum, p) => sum + (p.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TicketPercent className="w-6 h-6 text-[#08B4B5]" />
            Management Voucher & Promo Platform
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau kode promo dan voucher diskon yang digunakan, affiliator pemilik/penjualnya, serta total tiket yang berhasil terjual.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kode Promo</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Promo Aktif</span>
            <TicketPercent className="w-4 h-4 text-[#08B4B5]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{promos.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tiket Terjual via Promo</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalUses.toLocaleString('id-ID')} Tiket</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Omset Penjualan Promo</span>
            <DollarSign className="w-4 h-4 text-[#08B4B5]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalOmset.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari kode promo, nama affiliator, atau event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer"
          >
            <option value="all">Semua Tipe Diskon</option>
            <option value="percentage">Persentase (%)</option>
            <option value="fixed">Nominal Tetap (Rp)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data promo...</p>
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Tidak ada kode promo yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Kode Promo</th>
                  <th className="py-3.5 px-4">Besaran Diskon</th>
                  <th className="py-3.5 px-4">Event Terkait</th>
                  <th className="py-3.5 px-4">Affiliator Penjual</th>
                  <th className="py-3.5 px-4">Terjual (Penggunaan)</th>
                  <th className="py-3.5 px-4">Total Omset</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPromos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sm text-[#08B4B5] bg-[#08B4B5]/10 px-2.5 py-1 rounded-lg border border-[#08B4B5]/20">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.type === 'percentage'
                        ? `${p.value}%`
                        : p.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 line-clamp-1">
                        {p.eventTitle || 'Semua Event'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.partnerName ? (
                        <div>
                          <p className="font-bold text-slate-900">{p.partnerName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {p.partnerCode || p.partnerEmail || '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Admin Platform</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">
                        {p.usageCount.toLocaleString('id-ID')} {p.usageLimit ? `/ ${p.usageLimit}` : 'kali'}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {p.usageCount} tiket terjual
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {p.grossSalesGenerated.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Promo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PROMO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-[#08B4B5]" />
                Buat Kode Promo Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.code) {
                  toast.error('Kode promo wajib diisi');
                  return;
                }
                createMutation.mutate(form);
              }}
              className="space-y-4 text-xs"
            >
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
                  placeholder="Contoh: DISKONHEMAT2026"
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
                    Nilai Potongan {form.type === 'percentage' ? '(%)' : '(Rp)'}
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
                    onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value, 10) || 500 })}
                    placeholder="Kosongkan jika unlimited"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Berlaku</label>
                  <select
                    value={form.eventId}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  >
                    <option value="">Semua Event (Platform Wide)</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-700 block">
                  Asosiasi Partner / Affiliator (Opsional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={form.partnerName}
                    onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                    placeholder="Nama Affiliator / Komunitas"
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:border-[#08B4B5] focus:outline-none text-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={form.partnerCode}
                    onChange={(e) => setForm({ ...form, partnerCode: e.target.value.toUpperCase() })}
                    placeholder="Kode Partner (cth: AFF01)"
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:border-[#08B4B5] focus:outline-none text-slate-800 text-xs uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Terbitkan Kode Promo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Kode Promo?</h3>
                <p className="text-xs text-slate-500">{deleteConfirm.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Kode promo ini tidak akan dapat digunakan lagi untuk transaksi baru.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
