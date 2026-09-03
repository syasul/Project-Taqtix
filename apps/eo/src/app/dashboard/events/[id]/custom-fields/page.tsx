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
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  IdCard,
  Calendar,
  Users,
  MapPin,
  Shirt,
  PhoneCall,
  Building,
  AtSign,
  HeartPulse,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import EventTabs from '@/components/layout/event-tabs';
import { toast } from 'sonner';

interface CustomFieldItem {
  id: string;
  label: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  options: string[] | null;
  required: boolean;
  order: number;
}

// Preset daftar formulir populer yang siap di-ON / OFF kan
const PRESET_FIELDS = [
  {
    key: 'nik',
    label: 'Nomor Induk Kependudukan (NIK / KTP)',
    fieldType: 'text' as const,
    options: null,
    required: true,
    icon: IdCard,
    desc: 'Verifikasi identitas resmi peserta acara',
  },
  {
    key: 'dob',
    label: 'Tanggal Lahir',
    fieldType: 'date' as const,
    options: null,
    required: false,
    icon: Calendar,
    desc: 'Untuk verifikasi batas usia tiket',
  },
  {
    key: 'gender',
    label: 'Jenis Kelamin',
    fieldType: 'dropdown' as const,
    options: ['Laki-laki', 'Perempuan'],
    required: false,
    icon: Users,
    desc: 'Pengaturan zona duduk atau kategori peserta',
  },
  {
    key: 'address',
    label: 'Alamat Domisili Lengkap',
    fieldType: 'text' as const,
    options: null,
    required: false,
    icon: MapPin,
    desc: 'Pengiriman merchandise atau data demografi kota',
  },
  {
    key: 'shirt_size',
    label: 'Ukuran Kaos / Jersey',
    fieldType: 'dropdown' as const,
    options: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    required: false,
    icon: Shirt,
    desc: 'Untuk paket tiket dengan bundling merchandise',
  },
  {
    key: 'emergency_phone',
    label: 'Nomor Kontak Darurat',
    fieldType: 'text' as const,
    options: null,
    required: false,
    icon: PhoneCall,
    desc: 'Protokol keselamatan medis di lokasi event',
  },
  {
    key: 'institution',
    label: 'Nama Instansi / Komunitas / Kampus',
    fieldType: 'text' as const,
    options: null,
    required: false,
    icon: Building,
    desc: 'Pelacakan asal peserta komunitas',
  },
  {
    key: 'social_media',
    label: 'Akun Instagram / TikTok',
    fieldType: 'text' as const,
    options: null,
    required: false,
    icon: AtSign,
    desc: 'Untuk engagement komunitas & doorprize',
  },
  {
    key: 'medical_history',
    label: 'Riwayat Penyakit / Alergi',
    fieldType: 'text' as const,
    options: null,
    required: false,
    icon: HeartPulse,
    desc: 'Penanganan tim medis saat hari H',
  },
];

export default function CustomFieldsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [fields, setFields] = useState<CustomFieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

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
      toast.error(err?.response?.data?.message || 'Gagal memuat formulir kustom');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchFields();
  }, [eventId]);

  // Cek apakah preset sudah aktif di database
  const getActivePresetField = (label: string) => {
    return fields.find(
      (f) =>
        f.label.toLowerCase().includes(label.toLowerCase().slice(0, 10)) ||
        label.toLowerCase().includes(f.label.toLowerCase().slice(0, 10))
    );
  };

  // Toggle Preset ON / OFF
  const handleTogglePreset = async (preset: (typeof PRESET_FIELDS)[0]) => {
    const existingField = getActivePresetField(preset.label);
    setTogglingKey(preset.key);

    try {
      if (existingField) {
        // Matikan: Hapus field dari event
        await apiClient.delete(`/organizer/events/${eventId}/custom-fields/${existingField.id}`);
        toast.success(`Formulir "${preset.label}" dinonaktifkan`);
      } else {
        // Hidupkan: Tambahkan field ke event
        const payload: any = {
          label: preset.label,
          fieldType: preset.fieldType,
          required: preset.required,
        };
        if (preset.options) {
          payload.options = preset.options;
        }
        await apiClient.post(`/organizer/events/${eventId}/custom-fields`, payload);
        toast.success(`Formulir "${preset.label}" berhasil diaktifkan`);
      }
      await fetchFields();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui status formulir');
    } finally {
      setTogglingKey(null);
    }
  };

  // Toggle Required Status
  const handleToggleRequired = async (field: CustomFieldItem) => {
    try {
      await apiClient.patch(`/organizer/events/${eventId}/custom-fields/${field.id}`, {
        required: !field.required,
      });
      toast.success(
        `Field "${field.label}" diubah menjadi ${!field.required ? 'Wajib' : 'Opsional'}`
      );
      fetchFields();
    } catch (err: any) {
      toast.error('Gagal mengubah status wajib');
    }
  };

  // Create Custom Manual Field
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Formulir kustom baru berhasil ditambahkan');
      setIsOpen(false);
      setForm({
        label: '',
        fieldType: 'text',
        optionsString: '',
        required: false,
      });
      fetchFields();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan formulir');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Hapus field formulir ini?')) return;
    try {
      await apiClient.delete(`/organizer/events/${eventId}/custom-fields/${fieldId}`);
      toast.success('Field berhasil dihapus');
      fetchFields();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Formulir Kustom Peserta' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#08B4B5]" />
            Formulir Tambahan Peserta
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kumpulkan informasi khusus dari pembeli tiket saat checkout. Formulir ini otomatis muncul baik untuk pemesanan tiket tanpa login (Guest Checkout) maupun user yang login.
          </p>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pertanyaan Kustom</span>
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#08B4B5]" />
                Buat Formulir Baru
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateManual} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pertanyaan / Label Field *</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Contoh: Nomor Anggota Komunitas"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipe Input</label>
                <select
                  value={form.fieldType}
                  onChange={(e) => setForm({ ...form, fieldType: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                >
                  <option value="text">Teks Singkat (Text)</option>
                  <option value="number">Angka (Number)</option>
                  <option value="date">Tanggal (Date)</option>
                  <option value="dropdown">Pilihan Dropdown</option>
                  <option value="checkbox">Pilihan Kotak Centang (Checkbox)</option>
                </select>
              </div>

              {['dropdown', 'checkbox'].includes(form.fieldType) && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Opsi Pilihan (Pisahkan dengan koma) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.optionsString}
                    onChange={(e) => setForm({ ...form, optionsString: e.target.value })}
                    placeholder="Pilihan A, Pilihan B, Pilihan C"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_manual"
                  checked={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.checked })}
                  className="rounded text-[#08B4B5] focus:ring-[#08B4B5] cursor-pointer"
                />
                <label htmlFor="req_manual" className="font-semibold text-slate-700 cursor-pointer">
                  Wajib Diisi oleh Pembeli (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Field'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guest & Logged In User Notice */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
        <UserCheck className="w-5 h-5 text-[#08B4B5] shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Dukungan Pemesanan Fleksibel</strong>
          Semua field formulir kustom di bawah ini otomatis diintegrasikan ke halaman checkout event publik Taqtix. Pembeli dapat memesan tanpa wajib login terlebih dahulu (Guest Checkout), maupun dengan akun terdaftar.
        </div>
      </div>

      {/* 1. PRESET FORMULIR CEPAT (ON / OFF SWITCH) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#08B4B5]" />
            <h2 className="text-base font-bold text-slate-900">Preset Formulir Populer (1-Klik Aktifkan)</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Tersedia {PRESET_FIELDS.length} Template Standar
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Cukup klik tombol saklar ON/OFF untuk langsung memunculkan formulir data peserta pada tiket event ini tanpa perlu mengetik manual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {PRESET_FIELDS.map((preset) => {
            const Icon = preset.icon;
            const activeField = getActivePresetField(preset.label);
            const isCurrentlyActive = !!activeField;
            const isToggling = togglingKey === preset.key;

            return (
              <div
                key={preset.key}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'bg-[#08B4B5]/5 border-[#08B4B5]/40 shadow-xs ring-1 ring-[#08B4B5]/20'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isCurrentlyActive ? 'bg-[#08B4B5] text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-xs line-clamp-1">{preset.label}</span>
                    </div>

                    <button
                      onClick={() => handleTogglePreset(preset)}
                      disabled={isToggling}
                      className="cursor-pointer transition transform active:scale-95 shrink-0"
                      title={isCurrentlyActive ? 'Matikan field ini' : 'Aktifkan field ini'}
                    >
                      {isToggling ? (
                        <Loader2 className="w-6 h-6 text-[#08B4B5] animate-spin" />
                      ) : isCurrentlyActive ? (
                        <ToggleRight className="w-8 h-8 text-[#08B4B5]" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 leading-snug">{preset.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">
                    {preset.fieldType}
                  </span>
                  {isCurrentlyActive && activeField && (
                    <button
                      onClick={() => handleToggleRequired(activeField)}
                      className={`font-bold px-2 py-0.5 rounded-md cursor-pointer transition ${
                        activeField.required
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {activeField.required ? 'Wajib' : 'Opsional'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DAFTAR FORMULIR YANG SEDANG AKTIF */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#08B4B5]" />
            <h2 className="text-base font-bold text-slate-900">Formulir Aktif pada Tiket ({fields.length})</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Urutan pertanyaan saat checkout
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 text-[#08B4B5] animate-spin" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <p className="font-semibold text-slate-600">Belum ada formulir tambahan yang aktif.</p>
            <p>Aktifkan preset di atas atau klik "Tambah Pertanyaan Kustom".</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{field.label}</span>
                      {field.required ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                          Wajib
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded-md">
                          Opsional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tipe:{' '}
                      <span className="font-mono text-slate-600 uppercase font-semibold">
                        {field.fieldType}
                      </span>{' '}
                      {field.options && `• Opsi: ${field.options.join(', ')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleRequired(field)}
                    className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Set {field.required ? 'Opsional' : 'Wajib'}
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
