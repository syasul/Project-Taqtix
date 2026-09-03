'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const router = useRouter();
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

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Workforce & PIC Dashboard' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#08B4B5]" />
            Workforce Lite & PIC Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau kehadiran volunteer/crew per divisi, daftarkan anggota, dan salin tautan check-in mandiri.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Crew Baru</span>
        </button>
      </div>

      {dashboardLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat dashboard workforce...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Terdaftar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {dashboard.expected} Orang
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hadir
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {dashboard.present} Orang
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Terlambat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-amber-600 font-mono">
                  {dashboard.late} Orang
                </div>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Belum Hadir
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-rose-600 font-mono">
                  {dashboard.absent} Orang
                </div>
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <XCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members list */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Daftar Kehadiran Crew</CardTitle>
              <CardDescription className="text-xs text-slate-400">Monitor status check-in dan metode pencatatan kehadiran crew</CardDescription>
            </div>

            {dashboard.members.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada crew terdaftar untuk event ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Nama</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">WhatsApp</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Divisi</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Posisi</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Jam Hadir</th>
                      <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Tautan Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {dashboard.members.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3 font-mono text-slate-500">{m.phone}</td>
                        <td className="p-3 text-slate-600 capitalize">{m.division}</td>
                        <td className="p-3 text-slate-600">{m.role}</td>
                        <td className="p-3">
                          {m.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full">
                              Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded-full">
                              Belum Check-In
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {m.checkedInAt ? new Date(m.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {m.checkedInMethod && (
                            <span className="text-[9px] text-slate-400 block font-sans">({m.checkedInMethod.replace('_', ' ')})</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCopyLink(m.id)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#08B4B5]" />
                Tambah Crew Baru
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCrew} className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={crewPhone}
                  onChange={(e) => setCrewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Divisi</label>
                  <select
                    value={crewDivision}
                    onChange={(e) => setCrewDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  >
                    <option value="Ticketing">Ticketing</option>
                    <option value="F&B">F&B</option>
                    <option value="Security">Security</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Medic">Medic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Peran/Posisi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gate Scanner"
                    value={crewRole}
                    onChange={(e) => setCrewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">PIC Divisi (Pilih dari Tim)</label>
                <select
                  value={selectedPic}
                  onChange={(e) => setSelectedPic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                >
                  <option value="">Tanpa PIC Khusus (Default Owner/Admin)</option>
                  {team.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm border-0"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Crew</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
