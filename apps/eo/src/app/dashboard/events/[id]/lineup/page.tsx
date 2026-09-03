'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Mic2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface LineUpItem {
  id: string;
  name: string;
  photoUrl: string | null;
  performTime: string | null;
  stage: string | null;
  order: number;
}

export default function LineupPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [lineup, setLineup] = useState<LineUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    photoUrl: '',
    performTime: '',
    stage: '',
  });

  const fetchLineup = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/lineup`);
      setLineup(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat lineup acara');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchLineup();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      await apiClient.post(`/organizer/events/${eventId}/lineup`, {
        name: form.name.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        performTime: form.performTime.trim() || undefined,
        stage: form.stage.trim() || undefined,
      });
      setSuccessMsg('Pengisi acara berhasil ditambahkan');
      setIsOpen(false);
      setForm({ name: '', photoUrl: '', performTime: '', stage: '' });
      fetchLineup();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal menambahkan lineup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Hapus artis / performer ini?')) return;
    try {
      await apiClient.delete(`/organizer/events/${eventId}/lineup/${itemId}`);
      fetchLineup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newLineup = [...lineup];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLineup.length) return;

    const temp = newLineup[index];
    newLineup[index] = newLineup[targetIndex];
    newLineup[targetIndex] = temp;

    setLineup(newLineup);

    try {
      await apiClient.patch(`/organizer/events/${eventId}/lineup/reorder`, {
        orderedIds: newLineup.map((l) => l.id),
      });
    } catch (err) {
      fetchLineup();
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Line Up Performer' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Mic2 className="h-6 w-6 text-[#08B4B5]" />
            Line Up Performer & Jadwal Panggung
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Susun daftar artis, musisi, atau pembicara yang tampil beserta jadwal dan panggungnya.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              <span>Tambah Performer Baru</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-[#08B4B5]" />
                  Tambah Pengisi Acara
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nama Artis / Performer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sheila on 7, Pamungkas"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    URL Foto Artis (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.photoUrl}
                    onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Jadwal Tampil
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 19:30 - 21:00"
                      value={form.performTime}
                      onChange={(e) => setForm({ ...form, performTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Panggung / Area
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Main Stage"
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Performer'}
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

      {/* Lineup List */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : lineup.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Mic2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Line Up Performer</h3>
          <p className="text-slate-400 text-xs mt-1">
            Tambahkan artis yang akan tampil untuk menarik lebih banyak calon penonton.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {lineup.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-[#08B4B5] disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === lineup.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-[#08B4B5] disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-teal-50 border border-[#08B4B5]/30 flex items-center justify-center text-[#08B4B5] font-bold text-sm">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {item.performTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3 text-[#08B4B5]" />
                          {item.performTime}
                        </span>
                      )}
                      {item.stage && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {item.stage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Hapus"
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
