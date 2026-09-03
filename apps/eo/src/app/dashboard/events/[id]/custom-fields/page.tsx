'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface CustomFieldItem {
  id: string;
  label: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  options: string[] | null;
  required: boolean;
  order: number;
}

export default function CustomFieldsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [fields, setFields] = useState<CustomFieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    label: '',
    fieldType: 'text' as 'text' | 'number' | 'dropdown' | 'checkbox' | 'date',
    optionsString: '',
    required: false,
  });

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/custom-fields`);
      setFields(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat formulir tambahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchFields();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      const payload: any = {
        label: form.label.trim(),
        fieldType: form.fieldType,
        required: form.required,
      };

      if (['dropdown', 'checkbox'].includes(form.fieldType) && form.optionsString) {
        payload.options = form.optionsString
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
      }

      await apiClient.post(`/organizer/events/${eventId}/custom-fields`, payload);
      setSuccessMsg('Pertanyaan formulir baru berhasil ditambahkan');
      setIsOpen(false);
      setForm({
        label: '',
        fieldType: 'text',
        optionsString: '',
        required: false,
      });
      fetchFields();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal menambahkan formulir');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Hapus field formulir ini?')) return;
    try {
      await apiClient.delete(`/organizer/events/${eventId}/custom-fields/${fieldId}`);
      fetchFields();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    setFields(newFields);

    try {
      await apiClient.patch(`/organizer/events/${eventId}/custom-fields/reorder`, {
        orderedIds: newFields.map((f) => f.id),
      });
    } catch (err) {
      fetchFields();
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Formulir Tambahan' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <ClipboardList className="h-6 w-6 text-[#08B4B5]" />
            Formulir Tambahan (Custom Fields)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Kustomisasi data yang wajib atau opsional diisi pengunjung saat memesan tiket acara ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Plus className="h-4 w-4" />
              <span>Tambah Pertanyaan Baru</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#08B4B5]" />
                  Tambah Pertanyaan Formulir
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Label Pertanyaan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Nomor Induk Kependudukan (NIK), Ukuran Kaos"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Tipe Input</label>
                  <select
                    value={form.fieldType}
                    onChange={(e) => setForm({ ...form, fieldType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  >
                    <option value="text">Teks Bebas (Text)</option>
                    <option value="number">Angka (Number)</option>
                    <option value="dropdown">Pilihan Dropdown</option>
                    <option value="checkbox">Pilihan Checkbox / Multi-pilihan</option>
                    <option value="date">Tanggal (Date)</option>
                  </select>
                </div>

                {['dropdown', 'checkbox'].includes(form.fieldType) && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Daftar Opsi (Pisahkan dengan koma) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="S, M, L, XL, XXL atau Vegetarian, Non-Vegetarian"
                      value={form.optionsString}
                      onChange={(e) => setForm({ ...form, optionsString: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.required}
                      onChange={(e) => setForm({ ...form, required: e.target.checked })}
                      className="rounded border-slate-300 text-[#08B4B5] focus:ring-0"
                    />
                    <span>Wajib diisi oleh pengunjung (Required)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Pertanyaan'}
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

      {/* Fields List */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : fields.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <ClipboardList className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Pertanyaan Tambahan</h3>
          <p className="text-slate-400 text-xs mt-1">
            Klik tombol di atas untuk menambahkan pertanyaan kustom seperti NIK, instansi, atau preferensi.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {fields.map((field, idx) => (
            <div
              key={field.id}
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
                    disabled={idx === fields.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-[#08B4B5] disabled:opacity-30 transition cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{field.label}</h4>
                    {field.required ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600">
                        Wajib
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Opsional
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                    <span>Tipe: {field.fieldType}</span>
                    {field.options && field.options.length > 0 && (
                      <span>Opsi: [{field.options.join(', ')}]</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(field.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
