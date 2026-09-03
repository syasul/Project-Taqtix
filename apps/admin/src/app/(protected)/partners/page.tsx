'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  ExternalLink,
  Users,
  MousePointerClick,
  ShoppingCart,
  Banknote,
  DollarSign,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  email?: string;
  type: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
  uniqueCode: string;
  promoCode?: string | null;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  createdAt: string;
  eventId: string;
  event: {
    id: string;
    title: string;
  };
}

interface EventItem {
  id: string;
  title: string;
}

export default function PartnersOversightPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    eventId: '',
    type: 'COMMUNITY',
    uniqueCode: '',
    promoCode: '',
    commissionType: 'percentage',
    commissionValue: 10,
  });

  // Fetch Partners
  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ['admin-partners'],
    queryFn: () => api.get<Partner[]>('/admin/partners'),
  });

  // Fetch Events for dropdown
  const { data: events = [] } = useQuery<EventItem[]>({
    queryKey: ['admin-events'],
    queryFn: () => api.get<EventItem[]>('/admin/events'),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/admin/partners', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        eventId: events[0]?.id || '',
        type: 'COMMUNITY',
        uniqueCode: '',
        promoCode: '',
        commissionType: 'percentage',
        commissionValue: 10,
      });
      toast.success('Partner afiliasi berhasil ditambahkan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan partner');
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Partner> }) =>
      api.patch(`/admin/partners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setEditingPartner(null);
      toast.success('Data partner berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui partner');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setDeletingPartner(null);
      toast.success('Partner berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus partner');
    },
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.uniqueCode) {
      toast.error('Nama partner dan kode referral wajib diisi');
      return;
    }
    const finalEventId = formData.eventId || events[0]?.id || 'evt-1';
    createMutation.mutate({ ...formData, eventId: finalEventId });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    editMutation.mutate({
      id: editingPartner.id,
      data: {
        name: editingPartner.name,
        eventId: editingPartner.eventId,
        type: editingPartner.type,
        uniqueCode: editingPartner.uniqueCode,
        promoCode: editingPartner.promoCode,
        commissionType: editingPartner.commissionType,
        commissionValue: editingPartner.commissionValue,
        email: editingPartner.email,
      },
    });
  };

  // Metrics summary
  const totalClicks = partners.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalConversions = partners.reduce((sum, p) => sum + (p.conversions || 0), 0);
  const totalRevenue = partners.reduce((sum, p) => sum + (p.revenueGenerated || 0), 0);
  const totalCommission = partners.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);

  // Filter
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.event?.title && p.event.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'AMBASSADOR':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'INFLUENCER':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'COMMUNITY':
        return 'bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/30';
      case 'CORPORATE':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-[#08B4B5]" />
            Program Partner & Afiliasi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola mitra rujukan tiket, buat tautan afiliasi unik, dan pantau bagi-hasil komisi secara transparan.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              password: '',
              eventId: events[0]?.id || 'evt-1',
              type: 'COMMUNITY',
              uniqueCode: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
              promoCode: '',
              commissionType: 'percentage',
              commissionValue: 10,
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm border-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Partner Afiliasi</span>
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Partner</span>
            <Users className="w-4 h-4 text-[#08B4B5]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{partners.length} Mitra</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Kunjungan</span>
            <MousePointerClick className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClicks.toLocaleString('id-ID')} Klik</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Omzet Penjualan</span>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalRevenue)}</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Komisi Disalurkan</span>
            <Banknote className="w-4 h-4 text-[#08B4B5]" />
          </div>
          <div className="text-2xl font-black text-[#08B4B5]">{formatRupiah(totalCommission)}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama partner, kode referral, atau judul event..."
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
            <option value="all">Semua Tipe Mitra</option>
            <option value="COMMUNITY">Community</option>
            <option value="INFLUENCER">Influencer</option>
            <option value="AMBASSADOR">Ambassador</option>
            <option value="CORPORATE">Corporate</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat data partner...</span>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Belum ada partner afiliasi yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Nama Partner</th>
                  <th className="p-4">Event Terkait</th>
                  <th className="p-4">Kode Referral & Promo</th>
                  <th className="p-4">Skema Komisi</th>
                  <th className="p-4">Statistik Performa</th>
                  <th className="p-4">Omzet & Komisi</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Type */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getTypeBadge(p.type)}`}>
                          {p.type}
                        </span>
                        {p.email && <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.email}</span>}
                      </div>
                    </td>

                    {/* Event */}
                    <td className="p-4 font-medium text-slate-700 max-w-xs">
                      {p.event?.title || 'Semua Event'}
                    </td>

                    {/* Code */}
                    <td className="p-4">
                      <div className="font-mono text-xs text-[#08B4B5] font-bold bg-[#08B4B5]/10 px-2 py-1 rounded inline-block border border-[#08B4B5]/20">
                        {p.uniqueCode}
                      </div>
                      {p.promoCode && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Diskon: <strong className="text-slate-700">{p.promoCode}</strong>
                        </div>
                      )}
                    </td>

                    {/* Commission Scheme */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">
                        {p.commissionType === 'percentage'
                          ? `${p.commissionValue}% / tiket`
                          : `${formatRupiah(p.commissionValue)} / tiket`}
                      </span>
                    </td>

                    {/* Performance */}
                    <td className="p-4 font-mono">
                      <div className="text-slate-700">{p.clicks} Klik</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 font-bold">{p.conversions} Tiket Terjual</div>
                    </td>

                    {/* Revenue & Commission */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-800">{formatRupiah(p.revenueGenerated)}</div>
                      <div className="font-mono font-bold text-emerald-600 text-[11px] mt-0.5">
                        {formatRupiah(p.commissionEarned)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => setEditingPartner(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingPartner(p)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Hapus Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#08B4B5]/10 text-[#08B4B5] rounded-lg">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Tambah Partner Afiliasi</h3>
                  <p className="text-xs text-slate-500">Buat tautan rujukan dan kode promosi untuk mitra.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Partner / Afiliator *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Komunitas Muda Mengaji"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Mitra (Login Partner)
                  </label>
                  <input
                    type="email"
                    placeholder="partner@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Kemitraan
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="COMMUNITY">Community (Komunitas)</option>
                    <option value="INFLUENCER">Influencer / KOL</option>
                    <option value="AMBASSADOR">Campus Ambassador</option>
                    <option value="CORPORATE">Corporate Partner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Yang Dipromosikan *
                </label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Referral Unik *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MUDA2026"
                    value={formData.uniqueCode}
                    onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#08B4B5] focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Promo Diskon (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: DISKON10K"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenis Komisi
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {formData.commissionType === 'percentage' ? 'Nilai Persentase (%)' : 'Nilai Nominal (IDR)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={formData.commissionType === 'percentage' ? '0.5' : '1000'}
                    placeholder={formData.commissionType === 'percentage' ? '10' : '15000'}
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm border-0"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPartner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#08B4B5]/10 text-[#08B4B5] rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Partner Afiliasi</h3>
                  <p className="text-xs text-slate-500">Perbarui informasi partner dan pengaturan komisi.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Partner
                </label>
                <input
                  type="text"
                  required
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Mitra
                  </label>
                  <input
                    type="email"
                    value={editingPartner.email || ''}
                    onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Mitra
                  </label>
                  <select
                    value={editingPartner.type}
                    onChange={(e) => setEditingPartner({ ...editingPartner, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="COMMUNITY">Community</option>
                    <option value="INFLUENCER">Influencer</option>
                    <option value="AMBASSADOR">Ambassador</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Referral
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPartner.uniqueCode}
                    onChange={(e) => setEditingPartner({ ...editingPartner, uniqueCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#08B4B5] focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Promo Diskon
                  </label>
                  <input
                    type="text"
                    value={editingPartner.promoCode || ''}
                    onChange={(e) => setEditingPartner({ ...editingPartner, promoCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenis Komisi
                  </label>
                  <select
                    value={editingPartner.commissionType}
                    onChange={(e) => setEditingPartner({ ...editingPartner, commissionType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {editingPartner.commissionType === 'percentage' ? 'Nilai Persentase (%)' : 'Nilai Nominal (IDR)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPartner.commissionValue}
                    onChange={(e) => setEditingPartner({ ...editingPartner, commissionValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm border-0"
                >
                  {editMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingPartner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Hapus Partner Afiliasi?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus partner <strong>{deletingPartner.name}</strong> ({deletingPartner.uniqueCode})? Kode referral ini tidak akan dapat digunakan lagi untuk atribusi pembelian tiket.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setDeletingPartner(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingPartner.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
