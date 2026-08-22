'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Check,
  XOctagon,
  Search,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  plan: 'starter' | 'pro' | 'enterprise';
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  eventCount: number;
}

export default function OrganizersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: string; action: 'approve' | 'suspend'; name: string } | null>(null);

  // Fetch Organizers
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ['admin-organizers'],
    queryFn: () => api.get<Organizer[]>('/admin/organizers'),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizers/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowConfirmModal(null);
    },
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizers/${id}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowConfirmModal(null);
    },
  });

  // Plan Mutation
  const planMutation = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: 'starter' | 'pro' | 'enterprise' }) =>
      api.patch(`/admin/organizers/${id}/plan`, { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
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

  // Filtering Logic
  const filteredOrganizers = organizers.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Organizer</h1>
          <p className="text-slate-500 text-sm mt-1">
            Validasi penyelenggara event yang mendaftar dan atur paket layanan mereka.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama organizer atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-sm cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Approval</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data organizer...</p>
          </div>
        ) : filteredOrganizers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Tidak ada organizer ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="p-4">Nama Penyelenggara</th>
                  <th className="p-4">Kontak</th>
                  <th className="p-4">Paket Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Event</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{org.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {org.id}</div>
                    </td>
                    {/* Contact */}
                    <td className="p-4">
                      <div className="text-slate-600">{org.email}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{org.phone}</div>
                    </td>
                    {/* Plan Plan */}
                    <td className="p-4">
                      <select
                        value={org.plan}
                        onChange={(e) => planMutation.mutate({ id: org.id, plan: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:border-red-500 cursor-pointer shadow-sm"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          org.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : org.status === 'suspended'
                            ? 'bg-red-55 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          org.status === 'active' ? 'bg-emerald-500' : org.status === 'suspended' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        {org.status === 'active' ? 'Aktif' : org.status === 'suspended' ? 'Ditangguhkan' : 'Pending Approval'}
                      </span>
                    </td>
                    {/* EventCount */}
                    <td className="p-4 font-mono font-medium text-slate-600">
                      {org.eventCount} Event
                    </td>
                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {org.status === 'pending' && (
                          <button
                            onClick={() => setShowConfirmModal({ id: org.id, action: 'approve', name: org.name })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {org.status === 'active' && (
                          <button
                            onClick={() => setShowConfirmModal({ id: org.id, action: 'suspend', name: org.name })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XOctagon className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className={`p-3 rounded-lg border shrink-0 ${
                showConfirmModal.action === 'approve' 
                  ? 'bg-emerald-50 border-emerald-25 text-emerald-600' 
                  : 'bg-red-55 border-red-25 text-red-600'
              }`}>
                {showConfirmModal.action === 'approve' ? <UserCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-bounce" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {showConfirmModal.action === 'approve' ? 'Setujui Organizer?' : 'Tangguhkan Organizer?'}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin {showConfirmModal.action === 'approve' ? 'menyetujui' : 'menangguhkan'} organizer <strong>{showConfirmModal.name}</strong>? Aksi ini akan dicatat ke dalam audit log aktivitas admin.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-semibold">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={approveMutation.isPending || suspendMutation.isPending}
                className={`px-4 py-2 rounded-lg text-white transition-colors cursor-pointer ${
                  showConfirmModal.action === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approveMutation.isPending || suspendMutation.isPending ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
