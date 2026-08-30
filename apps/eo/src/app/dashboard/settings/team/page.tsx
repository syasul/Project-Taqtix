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
  const isOwner = currentMemberRole === 'owner' || user?.role === 'organizer'; // Fallback legacy owner

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            Kelola Akses Tim
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Undang rekan kerja dan berikan hak akses sesuai tanggung jawab masing-masing.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Undang Anggota
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Memuat anggota tim...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            Belum ada anggota tim terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-4 text-xs font-bold uppercase text-slate-400">Email</th>
                  <th className="p-4 text-xs font-bold uppercase text-slate-400">Peran</th>
                  <th className="p-4 text-xs font-bold uppercase text-slate-400">Status</th>
                  <th className="p-4 text-xs font-bold uppercase text-slate-400">Tanggal Gabung</th>
                  <th className="p-4 text-xs font-bold uppercase text-slate-400">Login Terakhir</th>
                  {isOwner && <th className="p-4 text-xs font-bold uppercase text-slate-400 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-850/40 transition">
                    <td className="p-4 text-sm text-slate-200 font-medium">{member.email}</td>
                    <td className="p-4 text-sm">
                      {isOwner && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="finance">Finance</option>
                          <option value="marketing">Marketing</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                          <Shield className="h-3 w-3" />
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : member.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                          Removed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-400 font-mono">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-400 font-mono">
                      {member.user?.lastLoginAt ? new Date(member.user.lastLoginAt).toLocaleString('id-ID') : '-'}
                    </td>
                    {isOwner && (
                      <td className="p-4 text-right">
                        {member.role !== 'owner' && member.status !== 'removed' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl transition cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                Undang Rekan Tim
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Hak Akses (Role)</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="admin">Admin (Akses penuh kecuali pengaturan owner)</option>
                  <option value="finance">Finance (Pembayaran & Settlement)</option>
                  <option value="marketing">Marketing (Kupon & Analitik Iklan)</option>
                  <option value="viewer">Viewer (Hanya lihat data)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
