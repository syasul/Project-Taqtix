'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Check,
  XOctagon,
  Search,
  AlertTriangle,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Building2,
  ExternalLink,
  Shield,
  X,
  CreditCard,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  plan: 'starter' | 'pro' | 'enterprise';
  segment: 'event_builder' | 'event_ip_owner' | 'campus_community' | 'enterprise' | null;
  bankAccount?: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  eventCount: number;
}

export default function OrganizersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organizer | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organizer | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    id: string;
    action: 'approve' | 'suspend';
    name: string;
  } | null>(null);

  // Form states for Create Organizer
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    segment: 'event_builder',
    plan: 'starter',
    bankAccount: '',
    status: 'active',
  });

  // Fetch Organizers
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ['admin-organizers'],
    queryFn: () => api.get<Organizer[]>('/admin/organizers'),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/admin/organizers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        segment: 'event_builder',
        plan: 'starter',
        bankAccount: '',
        status: 'active',
      });
      toast.success('Akun Organizer / EO berhasil dibuat');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membuat organizer');
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organizer> }) =>
      api.patch(`/admin/organizers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      setEditingOrg(null);
      toast.success('Data Organizer berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui organizer');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/organizers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setDeletingOrg(null);
      toast.success('Organizer berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus organizer');
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizers/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowConfirmModal(null);
      toast.success('Organizer berhasil disetujui');
    },
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizers/${id}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowConfirmModal(null);
      toast.success('Organizer berhasil ditangguhkan');
    },
  });

  // Plan Mutation
  const planMutation = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: 'starter' | 'pro' | 'enterprise' }) =>
      api.patch(`/admin/organizers/${id}/plan`, { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      toast.success('Paket plan berhasil diperbarui');
    },
  });

  const handleActionConfirm = () => {
    if (!showConfirmModal) return;
    if (showConfirmModal.action === 'approve') {
      approveMutation.mutate(showConfirmModal.id);
    } else {
      suspendMutation.mutate(showConfirmModal.id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Mohon isi nama dan email organizer');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    editMutation.mutate({
      id: editingOrg.id,
      data: {
        name: editingOrg.name,
        phone: editingOrg.phone,
        segment: editingOrg.segment,
        plan: editingOrg.plan,
        bankAccount: editingOrg.bankAccount,
        status: editingOrg.status,
      },
    });
  };

  // Filtering Logic
  const filteredOrganizers = organizers.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || org.segment === segmentFilter;
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const getSegmentBadge = (segment: string | null) => {
    switch (segment) {
      case 'event_builder':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'event_ip_owner':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'campus_community':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'enterprise':
        return 'bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/30';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getSegmentLabel = (segment: string | null) => {
    switch (segment) {
      case 'event_builder':
        return 'Event Builder';
      case 'event_ip_owner':
        return 'Event IP Owner';
      case 'campus_community':
        return 'Campus & Community';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Unsegmented';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#08B4B5]" />
            Manajemen Organizer & EO
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola akun penyelenggara event, verifikasi persetujuan, dan atur batasan layanan tier.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm border-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Organizer Baru</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama organizer, email, atau kontak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Approval</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
          </select>

          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer"
          >
            <option value="all">Semua Segment</option>
            <option value="event_builder">Event Builder</option>
            <option value="event_ip_owner">Event IP Owner</option>
            <option value="campus_community">Campus & Community</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-[#08B4B5]/20 border-t-[#08B4B5] rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data organizer...</p>
          </div>
        ) : filteredOrganizers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Tidak ada organizer yang sesuai kriteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Nama Penyelenggara</th>
                  <th className="p-4">Kontak & Rekening</th>
                  <th className="p-4">Segment</th>
                  <th className="p-4">Paket Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Event</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="p-4">
                      <Link
                        href={`/organizers/${org.id}`}
                        className="font-bold text-slate-900 hover:text-[#08B4B5] transition-colors flex items-center gap-1.5"
                      >
                        <span>{org.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {org.id}</div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{org.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{org.phone || '-'}</div>
                      {org.bankAccount && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>{org.bankAccount}</span>
                        </div>
                      )}
                    </td>

                    {/* Segment */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getSegmentBadge(
                          org.segment
                        )}`}
                      >
                        {getSegmentLabel(org.segment)}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="p-4">
                      <select
                        value={org.plan}
                        onChange={(e) =>
                          planMutation.mutate({ id: org.id, plan: e.target.value as any })
                        }
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#08B4B5] cursor-pointer shadow-xs"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          org.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : org.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            org.status === 'active'
                              ? 'bg-emerald-500'
                              : org.status === 'suspended'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {org.status === 'active'
                          ? 'Aktif'
                          : org.status === 'suspended'
                          ? 'Ditangguhkan'
                          : 'Pending'}
                      </span>
                    </td>

                    {/* Event Count */}
                    <td className="p-4 font-mono font-semibold text-slate-700">
                      {org.eventCount} Event
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {org.status === 'pending' && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({ id: org.id, action: 'approve', name: org.name })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            title="Setujui Organizer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {org.status === 'active' && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({ id: org.id, action: 'suspend', name: org.name })
                            }
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Tangguhkan Organizer"
                          >
                            <XOctagon className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setEditingOrg(org)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Edit Organizer"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>

                        <button
                          onClick={() => setDeletingOrg(org)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Hapus Organizer"
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
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Tambah Akun Organizer / EO</h3>
                  <p className="text-xs text-slate-500">Buat akun mitra penyelenggara baru secara langsung.</p>
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
                  Nama Penyelenggara / Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Kreasi Nada Nusantara"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Akun Admin *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="admin@organizer.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Akun
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Default: Taqtix2026!"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp / Kontak
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Awal
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="active">Langsung Aktif</option>
                    <option value="pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer Segment
                  </label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="event_builder">Event Builder (Standard)</option>
                    <option value="event_ip_owner">Event IP Owner (Festival/Tahunan)</option>
                    <option value="campus_community">Campus & Community</option>
                    <option value="enterprise">Enterprise (Korporat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Paket Plan Layanan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="starter">Starter Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Informasi Rekening Bank (Payout)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Contoh: BCA 8891234455 a.n PT Kreasi Nada"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
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
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Akun Organizer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#08B4B5]/10 text-[#08B4B5] rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Data Organizer</h3>
                  <p className="text-xs text-slate-500">Perbarui profil dan tier layanan organizer.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Penyelenggara
                </label>
                <input
                  type="text"
                  required
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    disabled
                    value={editingOrg.email}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingOrg.phone}
                    onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Segment
                  </label>
                  <select
                    value={editingOrg.segment || 'event_builder'}
                    onChange={(e) => setEditingOrg({ ...editingOrg, segment: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="event_builder">Event Builder</option>
                    <option value="event_ip_owner">Event IP Owner</option>
                    <option value="campus_community">Campus & Community</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Paket Plan
                  </label>
                  <select
                    value={editingOrg.plan}
                    onChange={(e) => setEditingOrg({ ...editingOrg, plan: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Akun
                  </label>
                  <select
                    value={editingOrg.status}
                    onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                  >
                    <option value="active">Aktif</option>
                    <option value="pending">Pending Approval</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Info Rekening Payout
                  </label>
                  <input
                    type="text"
                    value={editingOrg.bankAccount || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, bankAccount: e.target.value })}
                    placeholder="BCA 8891234455 a.n PT..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <Link
                  href={`/organizers/${editingOrg.id}`}
                  className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1"
                >
                  Buka Halaman Detail Lengkap <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingOrg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Hapus Akun Organizer?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun <strong>{deletingOrg.name}</strong> ({deletingOrg.email})? Semua data terkait organizer ini akan dihapus dari platform. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setDeletingOrg(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingOrg.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Organizer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE / SUSPEND CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  showConfirmModal.action === 'approve'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}
              >
                {showConfirmModal.action === 'approve' ? (
                  <UserCheck className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {showConfirmModal.action === 'approve'
                    ? 'Setujui Organizer?'
                    : 'Tangguhkan Organizer?'}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin{' '}
                  {showConfirmModal.action === 'approve' ? 'menyetujui' : 'menangguhkan'} organizer{' '}
                  <strong>{showConfirmModal.name}</strong>? Aksi ini akan dicatat ke dalam audit log aktivitas admin.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={approveMutation.isPending || suspendMutation.isPending}
                className={`px-4 py-2 rounded-xl text-white transition-colors cursor-pointer ${
                  showConfirmModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {approveMutation.isPending || suspendMutation.isPending
                  ? 'Memproses...'
                  : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
