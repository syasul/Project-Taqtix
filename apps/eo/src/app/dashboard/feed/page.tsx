'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  FileText,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink,
  Upload,
  Clock,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { compressImage } from '@/lib/image-compressor';

interface EventItem {
  id: string;
  title: string;
  slug: string;
}

interface OrganizerPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  eventId?: string | null;
  createdAt: string;
  event?: EventItem | null;
}

export default function FeedManagementPage() {
  const [posts, setPosts] = useState<OrganizerPost[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    eventId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, eventsRes] = await Promise.all([
        apiClient.get('/organizers/feed'),
        apiClient.get('/events'),
      ]);

      setPosts(postsRes.data?.data || postsRes.data || []);
      const eventList = eventsRes.data?.data?.events || eventsRes.data?.events || eventsRes.data || [];
      setEvents(eventList);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar kabar');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      let processed = file;
      try {
        processed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
          mimeType: 'image/webp',
        });
      } catch {
        processed = file;
      }

      const formData = new FormData();
      formData.append('file', processed);

      const res = await apiClient.post('/upload', formData, { timeout: 30000 });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, imageUrl: url }));
        toast.success('Gambar berhasil diunggah!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Judul dan konten wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title: form.title.trim(),
        content: form.content.trim(),
      };
      if (form.imageUrl) payload.imageUrl = form.imageUrl.trim();
      if (form.eventId) payload.eventId = form.eventId;

      const res = await apiClient.post('/organizers/feed', payload);
      toast.success(res.data?.message || 'Kabar berhasil dipublikasikan');
      setDialogOpen(false);
      setForm({ title: '', content: '', imageUrl: '', eventId: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mempublikasikan kabar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kabar ini?')) return;

    try {
      setDeletingId(id);
      await apiClient.delete(`/organizers/feed/${id}`);
      toast.success('Kabar berhasil dihapus');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kabar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#08B4B5]" />
            Kabar & Feed Organizer
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Bagikan pengumuman rilis tiket, rundown, teaser, atau kabar terkini kepada audiens & followers Anda.
          </p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold px-4 py-2.5 h-auto shadow-sm self-start sm:self-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Kabar Baru</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Memuat kabar...</span>
        </div>
      ) : posts.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-white/60 p-12 text-center rounded-2xl shadow-xs">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Kabar yang Dipublikasikan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Gunakan fitur ini untuk menyapa pengikut, memberi update jadwal acara, atau promo tiket eksklusif. Kabar akan langsung muncul di laman publik Anda.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-5 rounded-xl border-slate-300 text-xs font-bold"
          >
            + Mulai Buat Kabar Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {post.imageUrl && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(post.createdAt), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                      </span>
                    </div>

                    {post.event && (
                      <Badge
                        variant="outline"
                        className="border-teal-200 text-[#08B4B5] bg-teal-50 text-[10px] font-semibold"
                      >
                        {post.event.title}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-4">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                    {post.content}
                  </p>
                </CardContent>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID: {post.id.slice(0, 8)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={deletingId === post.id}
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold h-8 px-2.5 rounded-lg"
                >
                  {deletingId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Buat Kabar Baru */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#08B4B5]" />
              Buat Kabar / Post Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kabar ini akan tampil secara publik di laman profil EO Anda dan dapat dibaca oleh seluruh audiens.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="post-title" className="text-xs font-bold text-slate-700">
                Judul Kabar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="post-title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Misal: Lineup Artis Fase 2 Resmi Diumumkan!"
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-content" className="text-xs font-bold text-slate-700">
                Isi Pengumuman / Pesan <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="post-content"
                required
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tuliskan detail informasi, jadwal, arahan tiket, atau ucapan untuk para penonton..."
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 focus:border-[#08B4B5]"
              />
            </div>

            {/* Hubungkan ke Event */}
            <div className="space-y-1.5">
              <Label htmlFor="post-event" className="text-xs font-bold text-slate-700">
                Kaitkan dengan Event (Opsional)
              </Label>
              <select
                id="post-event"
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 focus:border-[#08B4B5]"
              >
                <option value="">-- Tidak dikaitkan ke event khusus --</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Unggah Gambar */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Lampiran Gambar (Opsional)</Label>
              <div className="flex items-center gap-3">
                {form.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden relative shrink-0">
                    <img src={form.imageUrl} alt="Lampiran" className="w-full h-full object-cover" />
                  </div>
                ) : null}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-slate-200 text-xs font-bold"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {form.imageUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
                    </>
                  )}
                </Button>
                {form.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    Hapus
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border-slate-300 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploadingImage}
                className="rounded-xl bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold"
              >
                {submitting ? 'Menerbitkan...' : 'Terbitkan Kabar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
