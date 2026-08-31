'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <UserCheck className="h-6 w-6" />
            </div>
            Staff Penugasan Event
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tugaskan staf pemindai gerbang (Gate Staff) dan panitia khusus untuk event ini.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer">
            <Plus className="h-4 w-4" />
            Tugaskan Staff Baru
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Tugaskan Staff ke Event
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAssign} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Email Akun Staff
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@taqtix.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tugaskan Sekarang'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Belum Ada Staff Ditugaskan</h3>
          <p className="text-slate-500 text-xs mt-1">
            Tugaskan akun kru / volunteer untuk memindai tiket di pintu masuk.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-850">
          {staffList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-850/30 transition gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{item.user?.email}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {item.user?.role || 'GATE_STAFF'}
                    </span>
                    <span className="text-xs text-slate-500">
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
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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
