'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  Plus,
  Trash2,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface FacilityItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quota: number | null;
  sold: number;
  applicableTicketCategoryIds: string[] | null;
}

export default function FacilitiesPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    quota: '',
  });

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/facilities`);
      setFacilities(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat fasilitas event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchFacilities();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
      };
      if (form.quota) payload.quota = Number(form.quota);

      await apiClient.post(`/organizer/events/${eventId}/facilities`, payload);
      setSuccessMsg('Fasilitas baru berhasil ditambahkan');
      setIsOpen(false);
      setForm({ name: '', description: '', price: 0, quota: '' });
      fetchFacilities();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat fasilitas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (facilityId: string) => {
    if (!confirm('Hapus fasilitas ini?')) return;
    try {
      await apiClient.delete(`/organizer/events/${eventId}/facilities/${facilityId}`);
      fetchFacilities();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            Fasilitas Event (Add-ons)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sediakan fasilitas tambahan, paket merchandise, atau akses khusus untuk pembeli tiket.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer">
            <Plus className="h-4 w-4" />
            Tambah Fasilitas Baru
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                Tambah Fasilitas / Add-on
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Fasilitas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Official T-Shirt Bundle, Shuttle Bus Pass"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Deskripsi / Rincian
                </label>
                <textarea
                  rows={2}
                  placeholder="Rincian yang didapat pembeli..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Harga Tambahan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Batas Kuota Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Kosongkan jika ∞"
                    value={form.quota}
                    onChange={(e) => setForm({ ...form, quota: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Fasilitas'}
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

      {/* Facilities List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : facilities.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Belum Ada Fasilitas Tambahan</h3>
          <p className="text-slate-500 text-xs mt-1">
            Tambahkan paket merchandise atau layanan add-on untuk meningkatkan average order value.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 hover:border-slate-750 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-100">{fac.name}</h4>
                  <button
                    onClick={() => handleDelete(fac.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {fac.description && (
                  <p className="text-xs text-slate-400 mb-3">{fac.description}</p>
                )}

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-850">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Harga Satuan:</span>
                    <span className="font-black text-emerald-400">
                      {fac.price > 0 ? `Rp ${fac.price.toLocaleString('id-ID')}` : 'Gratis / Free'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Terjual / Kuota:</span>
                    <span className="font-semibold text-slate-200">
                      {fac.sold} / {fac.quota !== null ? fac.quota : 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
