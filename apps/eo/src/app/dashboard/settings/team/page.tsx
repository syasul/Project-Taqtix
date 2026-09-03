'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Clock, 
  CheckCircle, 
  X, 
  Loader2 
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  joinedAt: string | null;
  user?: {
    lastLoginAt: string | null;
  } | null;
}

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);

  // Periksa apakah user adalah owner
  const currentMemberRole = members.find(m => m.email === user?.email)?.role || 'viewer';
  const isOwner = currentMemberRole === 'owner' || user?.role === 'organizer';

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organizer/team');
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar anggota tim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      const res = await apiClient.post('/organizer/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });

      if (res.data.success) {
        toast.success(`Berhasil mengundang ${inviteEmail}`);
        setIsInviteOpen(false);
        setInviteEmail('');
        setInviteRole('viewer');
        fetchTeam();
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'EMAIL_ALREADY_MEMBER') {
        toast.error('Email ini sudah menjadi bagian dari tim organizer');
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengirim undangan');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await apiClient.patch(`/organizer/team/${memberId}/role`, {
        role: newRole,
      });
      if (res.data.success) {
        toast.success('Peran berhasil diperbarui');
        fetchTeam();
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'LAST_OWNER_CANNOT_DEMOTE') {
        toast.error('Gagal: Harus ada minimal satu Owner aktif di tim');
      } else {
        toast.error('Gagal memperbarui peran');
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini dari tim?')) return;

    try {
      const res = await apiClient.delete(`/organizer/team/${memberId}`);
      if (res.data.success) {
        toast.success('Anggota tim berhasil dihapus');
        fetchTeam();
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'LAST_OWNER_CANNOT_REMOVE') {
        toast.error('Gagal: Owner satu-satunya tidak boleh dihapus');
      } else {
        toast.error('Gagal menghapus anggota tim');
      }
    }
  };

  const breadcrumbs = [
    { label: 'Pengaturan' },
    { label: 'Kelola Akses Tim' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#08B4B5]" />
            Kelola Akses Tim
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Undang rekan kerja dan berikan hak akses sesuai tanggung jawab masing-masing.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer border-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Undang Anggota</span>
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat anggota tim...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Belum ada anggota tim terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Email</th>
                  <th className="p-4">Peran</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal Gabung</th>
                  <th className="p-4">Login Terakhir</th>
                  {isOwner && <th className="p-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 text-slate-900 font-semibold">{member.email}</td>
                    <td className="p-4">
                      {isOwner && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#08B4B5] cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="finance">Finance</option>
                          <option value="marketing">Marketing</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold capitalize text-[#08B4B5] bg-teal-50 px-2.5 py-1 rounded-full border border-[#08B4B5]/30">
                          <Shield className="h-3 w-3" />
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          Active
                        </span>
                      ) : member.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          Removed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {member.user?.lastLoginAt ? new Date(member.user.lastLoginAt).toLocaleString('id-ID') : '-'}
                    </td>
                    {isOwner && (
                      <td className="p-4 text-right">
                        {member.role !== 'owner' && member.status !== 'removed' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition cursor-pointer"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#08B4B5]" />
                Undang Rekan Tim
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rekan@perusahaan.id"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hak Akses (Role)</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
                >
                  <option value="admin">Admin (Akses penuh fitur organizer)</option>
                  <option value="finance">Finance (Pembayaran & Settlement)</option>
                  <option value="marketing">Marketing (Kupon & Analitik Iklan)</option>
                  <option value="viewer">Viewer (Hanya lihat data)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm border-0"
                >
                  {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Kirim Undangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
