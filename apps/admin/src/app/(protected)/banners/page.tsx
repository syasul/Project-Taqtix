'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MockBanner } from '@/lib/api/client';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Loader2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BannerManagementPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MockBanner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MockBanner | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'home_hero' as 'home_hero' | 'event_top' | 'popup',
    order: 1,
    isActive: true,
  });

  // Fetch Banners
  const { data: banners = [], isLoading } = useQuery<MockBanner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => api.get<MockBanner[]>('/admin/banners'),
  });

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (editingBanner) {
        return api.patch(`/admin/banners/${editingBanner.id}`, data);
      }
      return api.post('/admin/banners', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setIsModalOpen(false);
      setEditingBanner(null);
      resetForm();
      toast.success(editingBanner ? 'Banner berhasil diperbarui' : 'Banner baru berhasil ditambahkan');
    },
    onError: () => {
      toast.error('Gagal menyimpan data banner');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setDeleteConfirm(null);
      toast.success('Banner berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus banner');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/banners/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Status aktif banner diperbarui');
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      imageUrl: '',
      targetUrl: '',
      position: 'home_hero',
      order: (banners.length || 0) + 1,
      isActive: true,
    });
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bnr: MockBanner) => {
    setEditingBanner(bnr);
    setForm({
      title: bnr.title,
      imageUrl: bnr.imageUrl,
      targetUrl: bnr.targetUrl,
      position: bnr.position,
      order: bnr.order,
      isActive: bnr.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast.error('Judul dan URL gambar banner wajib diisi');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#08B4B5]" />
            Kelola Banner Promosi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Atur banner carousel di landing page utama web untuk mempromosikan event unggulan dan kampanye platform.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Banner Baru</span>
        </button>
      </div>

      {/* Grid of Banners */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat banner...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Belum ada banner yang ditambahkan. Klik tombol di atas untuk membuat banner pertama.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((bnr) => (
              <div
                key={bnr.id}
                className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
              >
                {/* Image Banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={bnr.imageUrl}
                    alt={bnr.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                        bnr.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/80 backdrop-blur-xs text-white'
                      }`}
                    >
                      {bnr.isActive ? 'Aktif Tayang' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                    Urutan #{bnr.order}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{bnr.title}</h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{bnr.targetUrl || 'Tidak ada link'}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: bnr.id, isActive: !bnr.isActive })
                      }
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                        bnr.isActive
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {bnr.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(bnr)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(bnr)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#08B4B5]" />
                {editingBanner ? 'Edit Banner Promosi' : 'Tambah Banner Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul / Headline Banner *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Konser Religi Akbar 2026 - Beli Tiket Sekarang"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Gambar Banner *</label>
                <input
                  type="url"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... atau URL CDN"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                />
                {form.imageUrl && (
                  <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Tautan / Event Link</label>
                <input
                  type="text"
                  value={form.targetUrl}
                  onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                  placeholder="/events/slug-event atau https://taqtix.id/..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    min="1"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Banner</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  >
                    <option value="true">Aktif (Tampilkan)</option>
                    <option value="false">Nonaktif (Sembunyikan)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingBanner ? 'Simpan Perubahan' : 'Terbitkan Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Banner?</h3>
                <p className="text-xs text-slate-500">{deleteConfirm.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Banner ini akan dihapus dari carousel landing page web. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
