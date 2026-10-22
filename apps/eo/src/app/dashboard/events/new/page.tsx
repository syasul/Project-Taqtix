'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, PlusCircle, Upload, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import SeoFormSection from '@/components/seo-form-section';

const LocationMapPicker = dynamic(
  () => import('@/components/location-map-picker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-2xl bg-slate-100 animate-pulse flex flex-col items-center justify-center text-xs text-slate-400 gap-2 border border-slate-200">
        <Loader2 className="w-5 h-5 animate-spin text-[#08B4B5]" />
        <span>Memuat Peta Lokasi Leaflet...</span>
      </div>
    ),
  }
);

// Validasi Form menggunakan Zod
const eventSchema = z
  .object({
    title: z.string().min(5, { message: 'Judul event minimal 5 karakter' }),
    description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
    location: z.string().min(5, { message: 'Lokasi minimal 5 karakter' }),
    isDateTba: z.boolean().default(false),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    bannerUrl: z.string().url({ message: 'URL banner tidak valid' }).or(z.literal('')),
    requireLogin: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isDateTba) return true;
      if (!data.startDate) return false;
      return !isNaN(Date.parse(data.startDate));
    },
    { message: 'Format tanggal mulai salah atau belum diisi', path: ['startDate'] }
  )
  .refine(
    (data) => {
      if (data.isDateTba) return true;
      if (!data.endDate) return false;
      return !isNaN(Date.parse(data.endDate));
    },
    { message: 'Format tanggal selesai salah atau belum diisi', path: ['endDate'] }
  )
  .refine(
    (data) => {
      if (data.isDateTba) return true;
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'Tanggal selesai harus lebih lambat dari tanggal mulai',
      path: ['endDate'],
    }
  );

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadBannerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Harap unggah file gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran banner maksimal 20MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingBanner(true);
      setUploadProgress(0);
      const res = await apiClient.post('/upload', formData, {
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        setBannerError(false);
        form.setValue('bannerUrl', uploadedUrl, { shouldValidate: true, shouldDirty: true });
        toast.success('Banner berhasil diunggah langsung!');
      } else {
        toast.error('Gagal mendapatkan URL gambar');
      }
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        toast.error('Unggahan melebihi batas waktu (timeout). Periksa koneksi internet Anda atau gunakan gambar yang lebih kecil.');
      } else if (err?.response?.status === 413) {
        toast.error('Ukuran file terlalu besar untuk server (Nginx client_max_body_size limit).');
      } else {
        toast.error(
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Gagal mengunggah banner'
        );
      }
    } finally {
      setUploadingBanner(false);
      setUploadProgress(null);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadBannerFile(file);
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      isDateTba: false,
      startDate: '',
      endDate: '',
      bannerUrl: '',
      requireLogin: false,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const res = await apiClient.post('/organizer/events', values);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Draft event berhasil dibuat!');
      router.push('/dashboard/events');
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal membuat event baru.');
    },
  });

  const onSubmit = (values: EventFormValues) => {
    mutation.mutate(values);
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Buat Event Baru' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-[#08B4B5]" />
            Buat Event Baru
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftarkan event baru dengan mengisi rincian di bawah. Event yang dibuat pertama kali berstatus draft.
          </p>
        </div>

        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="outline"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-6">
          <CardTitle className="text-sm font-bold text-slate-900">Form Detail & Konfigurasi Event</CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Judul Event *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Taqwa Movement Concert 2026"
                        className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deskripsi Lengkap *</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Tuliskan rincian acara, pembicara/artis, syarat masuk..."
                        rows={5}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#08B4B5] focus:bg-white focus:outline-none text-xs transition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lokasi & Titik Peta Penyelenggaraan (Leaflet) *
                    </FormLabel>
                    <FormControl>
                      <LocationMapPicker
                        value={field.value}
                        onChange={(newAddress) => {
                          field.onChange(newAddress);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Requirement: Toggle Tanggal & Jam TBA */}
              <FormField
                control={form.control}
                name="isDateTba"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <FormLabel className="text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                          <span>Waktu & Tanggal Acara Belum Ditentukan (TBA)</span>
                          {field.value && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                              Status TBA
                            </span>
                          )}
                        </FormLabel>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Aktifkan jika tanggal atau jam acara masih dalam tahap finalisasi oleh pihak promotor. Di halaman publik akan tampil label <strong>TBA (To Be Announced)</strong>.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-5 h-5 accent-[#08B4B5] rounded cursor-pointer shrink-0"
                      />
                    </div>
                  </FormItem>
                )}
              />

              {!form.watch('isDateTba') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal & Jam Mulai *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal & Jam Selesai *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">Tanggal & Waktu Berstatus TBA</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Event akan ditampilkan dengan label &quot;Segera Diumumkan (TBA)&quot; di katalog dan tiket. Anda dapat mengisi tanggal pastinya kapan saja setelah jadwal resmi dirilis.
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Banner Event (Landscape 16:9)
                      </FormLabel>
                      {field.value && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Banner Siap</span>
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={handleBannerUpload}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />

                    {field.value ? (
                      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm group">
                        {bannerError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-500">
                            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2 stroke-[1.5]" />
                            <p className="text-xs font-bold text-slate-800">Pratinjau Banner Tidak Dapat Dimuat</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                              Tautan banner ({field.value}) tidak dapat diakses oleh peramban. Silakan coba klik &quot;Ganti Banner&quot; untuk mengunggah ulang.
                            </p>
                          </div>
                        ) : (
                          <img
                            src={field.value}
                            alt="Banner Event"
                            onError={() => setBannerError(true)}
                            onLoad={() => setBannerError(false)}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.01]"
                          />
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                          <Button
                            type="button"
                            size="sm"
                            disabled={uploadingBanner}
                            onClick={() => bannerInputRef.current?.click()}
                            className="bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md gap-1.5 cursor-pointer h-9 px-3.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                            <span>Ganti Banner</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => form.setValue('bannerUrl', '', { shouldDirty: true })}
                            className="rounded-xl text-xs font-bold shadow-md gap-1.5 cursor-pointer h-9 px-3.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </Button>
                        </div>

                        {/* Uploading Overlay during Replace */}
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 p-4 text-white z-20">
                            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
                            <p className="text-xs font-bold">
                              Mengunggah banner baru... {uploadProgress !== null && uploadProgress > 0 ? `(${uploadProgress}%)` : ''}
                            </p>
                            {uploadProgress !== null && (
                              <div className="w-48 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#08B4B5] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Top Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 text-teal-400" />
                          <span>Rasio 16:9 Landscape</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(true);
                        }}
                        onDragLeave={() => setIsDraggingBanner(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) uploadBannerFile(file);
                        }}
                        onClick={() => bannerInputRef.current?.click()}
                        className={cn(
                          'relative w-full aspect-[16/9] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none',
                          isDraggingBanner
                            ? 'border-[#08B4B5] bg-[#08B4B5]/5 scale-[0.99]'
                            : 'border-slate-300 hover:border-[#08B4B5] hover:bg-slate-50/70 bg-slate-50/40'
                        )}
                      >
                        {uploadingBanner ? (
                          <div className="flex flex-col items-center justify-center gap-2 max-w-xs w-full">
                            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
                            <p className="text-xs font-bold text-slate-700">
                              Sedang mengunggah banner... {uploadProgress !== null && uploadProgress > 0 ? `(${uploadProgress}%)` : ''}
                            </p>
                            {uploadProgress !== null && (
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#08B4B5] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400">Harap tunggu beberapa saat</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#08B4B5] flex items-center justify-center shadow-2xs">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800">
                                <span className="text-[#08B4B5] underline">Klik untuk pilih file banner</span> atau seret file ke sini
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Format: PNG, JPG, JPEG, atau WebP (Maksimum 20MB)
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-[10px] font-semibold mt-1">
                              📐 Rekomendasi 16:9 Landscape (1280x720 / 1920x1080 px)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Requirement: Toggle Wajib Login Pengunjung */}
              <FormField
                control={form.control}
                name="requireLogin"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <FormLabel className="text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                          <span>Wajibkan Pengunjung Login (Require Login)</span>
                          {field.value && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/30">
                              Aktif
                            </span>
                          )}
                        </FormLabel>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Jika diaktifkan, calon pembeli harus masuk (login) atau mendaftar akun TAQtix sebelum dapat menyelesaikan checkout tiket.
                        </p>
                      </div>
                      <FormControl>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            field.value ? 'bg-[#08B4B5]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              field.value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              {/* SEO & Double Engagement Section */}
              <SeoFormSection
                form={form}
                currentTitle={form.watch('title')}
                currentDescription={form.watch('description')}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-xs border-0"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Draft...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Sebagai Draft</span>
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
