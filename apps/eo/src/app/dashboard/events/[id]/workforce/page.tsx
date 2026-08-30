'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  UserCheck, 
  PlusCircle, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Loader2, 
  X 
} from 'lucide-react';

interface Crew {
  id: string;
  name: string;
  phone: string;
  division: string;
  role: string;
  status: string;
  checkedInAt: string | null;
  checkedInMethod: string | null;
}

export default function WorkforcePage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [crewName, setCrewName] = useState('');
  const [crewPhone, setCrewPhone] = useState('');
  const [crewDivision, setCrewDivision] = useState('Ticketing');
  const [crewRole, setCrewRole] = useState('Staff');
  const [selectedPic, setSelectedPic] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch organizer team for PIC selection
  const { data: teamResponse } = useQuery({
    queryKey: ['organizer-team'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/team');
      return res.data?.data || [];
    },
  });

  const team = teamResponse || [];

  // Fetch workforce details/dashboard
  const { data: dashboardResponse, isLoading: dashboardLoading, refetch } = useQuery({
    queryKey: ['workforce-dashboard', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/workforce/pic-dashboard`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  const dashboard = dashboardResponse || {
    division: 'All',
    expected: 0,
    present: 0,
    late: 0,
    absent: 0,
    members: [],
  };

  const handleAddCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewName || !crewPhone) return;

    try {
      setSaving(true);
      const res = await apiClient.post(`/organizer/events/${eventId}/workforce`, {
        name: crewName,
        phone: crewPhone,
        division: crewDivision,
        role: crewRole,
        picUserId: selectedPic || undefined,
      });

      if (res.data?.success) {
        toast.success('Crew berhasil didaftarkan');
        setIsInviteOpen(false);
        setCrewName('');
        setCrewPhone('');
        setCrewDivision('Ticketing');
        setCrewRole('Staff');
        setSelectedPic('');
        refetch();
      }
    } catch (err: any) {
      toast.error('Gagal mendaftarkan crew');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async (memberId: string) => {
    try {
      const res = await apiClient.get(`/organizer/workforce/${memberId}/link`);
      if (res.data?.success) {
        const link = res.data.data.link;
        navigator.clipboard.writeText(link);
        toast.success('Link check-in crew berhasil disalin ke clipboard');
      }
    } catch (err) {
      toast.error('Gagal mendapatkan link check-in');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            Workforce Lite & PIC Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau kehadiran volunteer/crew per divisi, daftarkan anggota, dan salin tautan check-in mandiri.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Tambah Crew Baru
        </button>
      </div>

      {dashboardLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat dashboard workforce...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-slate-850">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Terdaftar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-200 font-mono">
                  {dashboard.expected} Orang
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-855">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hadir
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {dashboard.present} Orang
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-855">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Terlambat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                  {dashboard.late} Orang
                </div>
                <Clock className="h-5 w-5 text-amber-500" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-855">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-505 uppercase tracking-wider">
                  Belum Hadir
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-rose-400 font-mono">
                  {dashboard.absent} Orang
                </div>
                <XCircle className="h-5 w-5 text-rose-500" />
              </CardContent>
            </Card>
          </div>

          {/* Members list */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Daftar Kehadiran Crew</CardTitle>
              <CardDescription className="text-xs text-slate-500">Monitor status check-in dan metode pencatatan kehadiran crew</CardDescription>
            </div>

            {dashboard.members.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Belum ada crew terdaftar untuk event ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Nama</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">WhatsApp</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Divisi</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Posisi</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase">Jam Hadir</th>
                      <th className="p-3 text-xs font-bold text-slate-400 uppercase text-right">Tautan Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {dashboard.members.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-850/30 transition">
                        <td className="p-3 text-xs font-bold text-slate-200">{m.name}</td>
                        <td className="p-3 text-xs font-mono text-slate-400">{m.phone}</td>
                        <td className="p-3 text-xs text-slate-400 capitalize">{m.division}</td>
                        <td className="p-3 text-xs text-slate-400">{m.role}</td>
                        <td className="p-3 text-xs">
                          {m.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">
                              Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 border border-slate-550 rounded-full">
                              Belum Check-In
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs font-mono text-slate-400">
                          {m.checkedInAt ? new Date(m.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {m.checkedInMethod && (
                            <span className="text-[9px] text-slate-500 block">({m.checkedInMethod.replace('_', ' ')})</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCopyLink(m.id)}
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                            title="Salin Link Onboarding Crew"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Tambah Crew Baru
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCrew} className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={crewPhone}
                  onChange={(e) => setCrewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Divisi</label>
                  <select
                    value={crewDivision}
                    onChange={(e) => setCrewDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="Ticketing">Ticketing</option>
                    <option value="F&B">F&B</option>
                    <option value="Security">Security</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Medic">Medic</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Peran/Posisi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gate Scanner"
                    value={crewRole}
                    onChange={(e) => setCrewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">PIC Divisi (Pilih dari Tim)</label>
                <select
                  value={selectedPic}
                  onChange={(e) => setSelectedPic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="">Tanpa PIC Khusus (Default Owner/Admin)</option>
                  {team.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
