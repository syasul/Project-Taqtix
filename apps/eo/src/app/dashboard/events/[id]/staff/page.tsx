'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  UserCheck,
  Users,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface StaffItem {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  assignedAt: string;
}

export default function EventStaffPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/gate-staff`);
      setStaffList(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat daftar staff event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchStaff();
  }, [eventId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      await apiClient.post(`/organizer/events/${eventId}/gate-staff`, {
        email: email.trim(),
      });
      setSuccessMsg('Staff berhasil ditugaskan ke event ini');
      setIsOpen(false);
      setEmail('');
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal menugaskan staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (staffId: string) => {
    if (!confirm('Hapus penugasan staff ini dari event?')) return;
    try {
      await apiClient.delete(`/organizer/events/${eventId}/gate-staff/${staffId}`);
      fetchStaff();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus penugasan');
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Staff Penugasan Event' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <UserCheck className="h-6 w-6 text-[#08B4B5]" />
            Staff Penugasan Event
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Tugaskan staf pemindai gerbang (Gate Staff) dan panitia khusus untuk event ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              <span>Tugaskan Staff Baru</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#08B4B5]" />
                  Tugaskan Staff ke Event
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAssign} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Email Akun Staff *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@taqtix.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tugaskan Sekarang'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Staff Ditugaskan</h3>
          <p className="text-slate-400 text-xs mt-1">
            Tugaskan akun kru / volunteer untuk memindai tiket di pintu masuk.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {staffList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-[#08B4B5]/30 flex items-center justify-center text-[#08B4B5] font-bold">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.user?.email}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/20">
                      {item.user?.role || 'GATE_STAFF'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Ditugaskan:{' '}
                      {new Date(item.assignedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemove(item.id)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Hapus Penugasan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
