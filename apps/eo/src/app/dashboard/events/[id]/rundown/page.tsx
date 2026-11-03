'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface RundownItem {
  id: string;
  timeRange: string;
  title: string;
  description: string | null;
  isHighlight: boolean;
  order: number;
}

export default function RundownPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [rundown, setRundown] = useState<RundownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RundownItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    timeRange: '',
    title: '',
    description: '',
    isHighlight: false,
  });

  const fetchRundown = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/rundown`);
      setRundown(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat susunan rundown acara');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchRundown();
  }, [eventId]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      timeRange: '',
      title: '',
      description: '',
      isHighlight: false,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item: RundownItem) => {
    setEditingItem(item);
    setForm({
      timeRange: item.timeRange,
      title: item.title,
      description: item.description || '',
      isHighlight: item.isHighlight,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.timeRange.trim() || !form.title.trim()) {
      toast.error('Waktu sesi dan judul agenda wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await apiClient.patch(`/organizer/events/${eventId}/rundown/${editingItem.id}`, {
          timeRange: form.timeRange.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          isHighlight: form.isHighlight,
        });
        toast.success('Agenda berhasil diperbarui');
      } else {
        await apiClient.post(`/organizer/events/${eventId}/rundown`, {
          timeRange: form.timeRange.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          isHighlight: form.isHighlight,
          order: rundown.length,
        });
        toast.success('Sesi agenda baru berhasil ditambahkan');
      }

      setIsOpen(false);
      fetchRundown();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan agenda');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi agenda ini?')) return;

    try {
      setDeletingId(id);
      await apiClient.delete(`/organizer/events/${eventId}/rundown/${id}`);
      toast.success('Agenda berhasil dihapus');
      fetchRundown();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus agenda');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rundown.length) return;

    const newRundown = [...rundown];
    const temp = newRundown[index];
    newRundown[index] = newRundown[targetIndex];
    newRundown[targetIndex] = temp;

    const items = newRundown.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    setRundown(newRundown);

    try {
      await apiClient.patch(`/organizer/events/${eventId}/rundown/reorder`, { items });
    } catch {
      fetchRundown();
    }
  };

  // Shortcut untuk mengisi template rundown standar umum festival
  const handlePrefillDefault = async () => {
    if (rundown.length > 0) {
      if (!confirm('Rundown saat ini akan digabungkan dengan template standar. Lanjutkan?')) return;
    }

    const defaultAgenda = [
      {
        timeRange: '08:00 - 09:00',
        title: 'Open Gate & Registrasi Kehadiran',
        description: 'Pemeriksaan barang bawaan dan pemindaian barcode e-ticket di pintu masuk venue oleh panitia.',
        isHighlight: false,
      },
      {
        timeRange: '09:00 - 09:30',
        title: 'Pembukaan & Sambutan Resmi',
        description: 'Pengondisian ruangan dan sambutan resmi dari pihak panitia penyelenggara acara.',
        isHighlight: false,
      },
      {
        timeRange: '09:30 - 11:30',
        title: 'Sesi Utama Acara & Pemaparan',
        description: 'Rangkaian agenda utama, pemaparan materi inti, dan penampilan pembicara/pengisi acara.',
        isHighlight: true,
      },
      {
        timeRange: '11:30 - 12:00',
        title: 'Tanya Jawab, Doa & Penutup',
        description: 'Sesi interaktif tanya jawab, ramah tamah antar peserta, dan doa penutup rangkaian acara.',
        isHighlight: false,
      },
    ];

    try {
      setLoading(true);
      for (let i = 0; i < defaultAgenda.length; i++) {
        await apiClient.post(`/organizer/events/${eventId}/rundown`, {
          ...defaultAgenda[i],
          order: rundown.length + i,
        });
      }
      toast.success('Template rundown standar berhasil dipasang');
      fetchRundown();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memasang template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Event Workspace', href: '/dashboard/events' },
          { label: 'Detail Event', href: `/dashboard/events/${eventId}` },
          { label: 'Rundown & Agenda' },
        ]}
      />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#08B4B5]/10 text-[#08B4B5] border border-[#08B4B5]/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Rundown & Susunan Acara</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Atur jadwal jam sesi dan detail agenda yang akan tampil pada halaman event pembeli.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {rundown.length === 0 && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrefillDefault}
              className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gunakan Template Cepat</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-[#08B4B5] hover:bg-[#07999a] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sesi Agenda</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Memuat susunan rundown...</span>
        </div>
      ) : rundown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#08B4B5]/10 text-[#08B4B5] flex items-center justify-center mx-auto mb-4 border border-[#08B4B5]/20">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada Agenda Rundown</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Rundown acara membantu calon pengunjung mengetahui estimasi jadwal kedatangan dan rangkaian kegiatan acara Anda.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrefillDefault}
              className="rounded-xl border-slate-200 text-xs font-bold text-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Gunakan Template Standar
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="bg-[#08B4B5] hover:bg-[#07999a] text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Manual
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rundown.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs ${
                item.isHighlight
                  ? 'border-[#08B4B5]/40 bg-teal-50/20 ring-1 ring-[#08B4B5]/20'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Order Number & Highlight Pill */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold font-mono">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Geser ke atas"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === rundown.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Time Range Badge */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                        item.isHighlight
                          ? 'bg-[#08B4B5] text-white border-[#08B4B5]'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {item.timeRange}
                    </span>

                    {item.isHighlight && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-[#08B4B5] border border-[#08B4B5]/30">
                        <Sparkles className="w-3 h-3" />
                        Sesi Utama (Highlight)
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(item)}
                  className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 h-9 px-3 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-xl border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 h-9 px-3 flex items-center gap-1.5"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>Hapus</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Modal Add / Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#08B4B5]" />
              <span>{editingItem ? 'Edit Sesi Agenda' : 'Tambah Sesi Agenda Baru'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Waktu Sesi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 08:00 - 09:00 atau 09:30 WIB"
                value={form.timeRange}
                onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#08B4B5] focus:ring-1 focus:ring-[#08B4B5]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format fleksibel (misal: jam pelaksanaan atau estimasi durasi).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Judul Agenda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Open Gate, Keynote Speaker, dsb."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#08B4B5] focus:ring-1 focus:ring-[#08B4B5]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Deskripsi Kegiatan (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan secara singkat detail atau panduan peserta pada sesi ini..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#08B4B5] focus:ring-1 focus:ring-[#08B4B5] resize-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={form.isHighlight}
                  onChange={(e) => setForm({ ...form, isHighlight: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-[#08B4B5] focus:ring-[#08B4B5] w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Tandai sebagai Sesi Utama (Highlight)
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Sesi ini akan diberi aksen warna hijau/teal menonjol pada rincian jadwal di halaman event publik.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="bg-[#08B4B5] hover:bg-[#07999a] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan Agenda'}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

