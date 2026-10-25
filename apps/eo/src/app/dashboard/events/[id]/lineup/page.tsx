'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Globe,
  ExternalLink,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { compressImage } from '@/lib/image-compressor';

interface LineUpItem {
  id: string;
  name: string;
  photoUrl: string | null;
  performTime: string | null;
  stage: string | null;
  socialUrl?: string | null;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    photoUrl: '',
    performTime: '',
    stage: '',
    socialUrl: '',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 10MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setErrorMsg('');

      let processedFile = file;
      try {
        processedFile = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          mimeType: 'image/webp',
        });
      } catch {
        processedFile = file;
      }

      const formData = new FormData();
      formData.append('file', processedFile);

      const res = await apiClient.post('/upload', formData, {
        timeout: 30000,
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, photoUrl: uploadedUrl }));
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal mengunggah foto artis');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
        socialUrl: form.socialUrl.trim() || undefined,
      });
      setSuccessMsg('Pengisi acara berhasil ditambahkan');
      setIsOpen(false);
      setForm({ name: '', photoUrl: '', performTime: '', stage: '', socialUrl: '' });
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
            <Mic2 className="h-6 w-6 text-[#08ADAE]" />
            Line Up Performer & Jadwal Panggung
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Susun daftar artis, musisi, atau pembicara yang tampil beserta foto, jadwal, panggung, dan tautan sosial media.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08ADAE] hover:bg-[#07999A] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              <span>Tambah Performer Baru</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-[#08ADAE]" />
                  Tambah Pengisi Acara
                </DialogTitle>
              </DialogHeader>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08ADAE] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* UPLOAD FOTO ARTIS */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Foto Artis / Performer (Opsional)
                  </label>

                  {form.photoUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.photoUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">Foto Terpasang</p>
                        <p className="text-[10px] text-slate-400 truncate">{form.photoUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, photoUrl: '' })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-[#08ADAE] bg-slate-50 hover:bg-slate-50/70 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 group"
                      >
                        {uploadingPhoto ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#08ADAE]">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Mengunggah foto...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-[#08ADAE] group-hover:border-[#08ADAE]/30 transition shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#08ADAE] transition">
                              Pilih Foto dari Perangkat (Upload)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              JPG, PNG, WebP (Maks. 5MB)
                            </span>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="pt-0.5">
                        <input
                          type="url"
                          placeholder="Atau tempel URL gambar (https://...)"
                          value={form.photoUrl}
                          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-900 focus:border-[#08ADAE] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08ADAE] focus:bg-white focus:outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08ADAE] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* LINK SOSMED */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Link Sosmed Performer (Opsional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://instagram.com/sheilaon7 atau spotify"
                      value={form.socialUrl}
                      onChange={(e) => setForm({ ...form, socialUrl: e.target.value })}
                      className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08ADAE] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pengunjung dapat mengklik tautan ini di halaman event untuk membuka profil artis.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08ADAE] hover:bg-[#07999A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
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
          <Loader2 className="h-8 w-8 text-[#08ADAE] animate-spin" />
        </div>
      ) : lineup.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Mic2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Line Up Performer</h3>
          <p className="text-slate-400 text-xs mt-1">
            Tambahkan artis atau pembicara yang akan tampil untuk melengkapi informasi acara Anda.
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
                    className="p-1 text-slate-400 hover:text-[#08ADAE] disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === lineup.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-[#08ADAE] disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-teal-50 border border-[#08ADAE]/30 flex items-center justify-center text-[#08ADAE] font-bold text-sm">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      {item.performTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3 text-[#08ADAE]" />
                          {item.performTime}
                        </span>
                      )}
                      {item.stage && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {item.stage}
                        </span>
                      )}
                      {item.socialUrl && (
                        <a
                          href={item.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#08ADAE] hover:underline font-semibold"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Sosmed</span>
                        </a>
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
