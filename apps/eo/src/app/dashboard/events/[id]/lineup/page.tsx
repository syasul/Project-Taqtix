'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Mic2 className="h-6 w-6" />
            </div>
            Line Up Performer & Jadwal Panggung
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Susun daftar artis, musisi, atau pembicara yang tampil beserta jadwal dan panggungnya.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer">
            <Plus className="h-4 w-4" />
            Tambah Performer Baru
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Mic2 className="h-5 w-5 text-indigo-400" />
                Tambah Pengisi Acara
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Artis / Performer
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sheila on 7, Pamungkas, Raditya Dika"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  URL Foto Artis (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Jadwal Tampil
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19:30 - 21:00"
                    value={form.performTime}
                    onChange={(e) => setForm({ ...form, performTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Panggung / Area
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Main Stage"
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Performer'}
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

      {/* Lineup List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : lineup.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <Mic2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Belum Ada Line Up Performer</h3>
          <p className="text-slate-500 text-xs mt-1">
            Tambahkan artis yang akan tampil untuk menarik lebih banyak calon penonton.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-850">
          {lineup.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-850/30 transition gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-slate-500 hover:text-indigo-400 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === lineup.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-500 hover:text-indigo-400 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {item.performTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-indigo-400" />
                          {item.performTime}
                        </span>
                      )}
                      {item.stage && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {item.stage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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
