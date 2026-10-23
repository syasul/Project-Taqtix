'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, Send, ShieldAlert, Edit3, Upload, ClipboardList, ArrowRight, Ticket, CheckCircle2, Image as ImageIcon, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import EventTabs from '@/components/layout/event-tabs';
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

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
  isDateTba?: boolean;
  startDate: string;
  endDate: string;
  requireLogin?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  adminSeoKeywords?: string;
  seoPriority?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'CANCELLED' | 'draft' | 'published' | 'ended' | 'cancelled';
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
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
        toast.error('Gagal mendapatkan URL gambar hasil upload');
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

  // Ambil daftar event milik organizer dan temukan event saat ini
  const { data: eventsList, isLoading: listLoading } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

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

  // Prepopulate form
  useEffect(() => {
    if (eventsList && eventId) {
      const found = eventsList.find((e: Event) => e.id === eventId);
      if (found) {
        setEvent(found);
        
        const toLocalString = (dateStr: string) => {
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const tzoffset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
          } catch {
            return '';
          }
        };

        const sanitizeUrl = (url: string | undefined | null) => {
          if (!url) return '';
          const trimmed = url.trim();
          if (
            trimmed === 'null' ||
            trimmed === 'undefined' ||
            trimmed === '""' ||
            trimmed === "''"
          ) {
            return '';
          }
          return trimmed;
        };

        form.reset({
          title: found.title,
          description: found.description || '',
          location: found.location,
          isDateTba: Boolean(found.isDateTba),
          startDate: toLocalString(found.startDate),
          endDate: toLocalString(found.endDate),
          bannerUrl: sanitizeUrl(found.bannerUrl),
          requireLogin: Boolean(found.requireLogin),
          seoTitle: found.seoTitle || '',
          seoDescription: found.seoDescription || '',
          seoKeywords: found.seoKeywords || '',
        });
      }
    }
  }, [eventsList, eventId, form]);

  // Mutation Edit Event
  const updateMutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const res = await apiClient.patch(`/organizer/events/${eventId}`, values);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      router.push('/dashboard/events');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal memperbarui event.');
    },
  });

  // Mutation Publish Event
  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/organizer/events/${eventId}/publish`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event sukses dipublikasikan dan aktif untuk publik!');
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      router.push('/dashboard/events');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal mempublikasikan event.');
    },
  });

  const onSubmit = (values: EventFormValues) => {
    updateMutation.mutate(values);
  };

  const handlePublish = () => {
    if (confirm('Apakah Anda yakin ingin mempublikasikan event ini? Setelah terpublikasi, pembeli dapat melihat dan membeli tiket event.')) {
      publishMutation.mutate();
    }
  };

  if (listLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Event Tidak Ditemukan</h2>
        <p className="text-slate-500 text-xs">Event yang ingin Anda ubah tidak terdaftar atau tidak dimiliki oleh akun Anda.</p>
        <Button onClick={() => router.push('/dashboard/events')} className="bg-[#08B4B5] hover:bg-[#079b9c] rounded-xl cursor-pointer text-xs text-white border-0 font-bold">
          Kembali ke Daftar Event
        </Button>
      </div>
    );
  }

  const isDraft = event.status.toUpperCase() === 'DRAFT';

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: event.title, href: `/dashboard/events/${eventId}/sales` },
    { label: 'Ubah Detail Event' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Event Sub-Navigation Tabs */}
      <EventTabs eventId={eventId as string} />

      {/* 3-Step Setup Workflow Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#08B4B5]/10 border-2 border-[#08B4B5] text-[#08B4B5] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#08B4B5] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            1
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#08B4B5] block">
              Tahap 1 (Aktif)
            </span>
            <span className="font-extrabold text-xs text-slate-900 truncate block">
              Detail Informasi Event
            </span>
          </div>
        </div>

        <Link
          href={`/dashboard/events/${eventId}/custom-fields`}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 transition flex items-center gap-3 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#08B4B5]/10 text-slate-600 group-hover:text-[#08B4B5] flex items-center justify-center font-black text-xs shrink-0 transition">
            2
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Tahap 2
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Syarat Pembeli
              </span>
            </div>
            <span className="font-bold text-xs text-slate-700 group-hover:text-[#08B4B5] truncate block">
              Syarat & Formulir Pembeli
            </span>
          </div>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/ticket-categories`}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 transition flex items-center gap-3 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#08B4B5]/10 text-slate-600 group-hover:text-[#08B4B5] flex items-center justify-center font-black text-xs shrink-0 transition">
            3
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tahap 3
            </span>
            <span className="font-bold text-xs text-slate-700 group-hover:text-[#08B4B5] truncate block">
              Kategori & Kuota Tiket
            </span>
          </div>
        </Link>
      </div>

      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-[#08B4B5]" />
            Ubah Detail Event
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ubah detail informasi event. Status saat ini:{' '}
            <span className="font-bold text-slate-700 uppercase font-mono">{event.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-1.5 cursor-pointer text-xs py-2 px-4 shadow-sm active:scale-[0.98] border-0"
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Publikasikan Event</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-6">
          <CardTitle className="text-sm font-bold text-slate-900">Form Pengaturan Event</CardTitle>
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
                        rows={5}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none text-xs transition"
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

                    {field.value && field.value.trim() !== '' && field.value !== 'null' && field.value !== 'undefined' ? (
                      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm group">
                        {bannerError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-600">
                            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2 stroke-[1.5]" />
                            <p className="text-xs font-bold text-slate-800">Pratinjau Banner Tidak Dapat Dimuat</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                              Tautan banner ({field.value}) tidak dapat diakses atau berkas tidak ditemukan di server.
                            </p>
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                type="button"
                                size="sm"
                                disabled={uploadingBanner}
                                onClick={() => bannerInputRef.current?.click()}
                                className="bg-[#08B4B5] hover:bg-[#07999a] text-white rounded-xl text-xs font-bold shadow-xs gap-1.5 cursor-pointer h-8 px-3.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Ganti Banner</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBannerError(false);
                                  form.setValue('bannerUrl', '', { shouldDirty: true });
                                }}
                                className="rounded-xl text-xs font-bold shadow-xs gap-1.5 cursor-pointer h-8 px-3.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </Button>
                            </div>
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
                        {!bannerError && (
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
                              onClick={() => {
                                setBannerError(false);
                                form.setValue('bannerUrl', '', { shouldDirty: true });
                              }}
                              className="rounded-xl text-xs font-bold shadow-md gap-1.5 cursor-pointer h-9 px-3.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </Button>
                          </div>
                        )}

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
                eventSlug={event?.slug || 'event-slug'}
              />

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-xs border-0"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Next Steps Guide Card (Syarat Pembeli & Kategori Tiket) */}
      <div className="p-5 bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/80 border border-teal-200/90 rounded-2xl space-y-3.5 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#08B4B5] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900">
                Langkah Selanjutnya: Atur Syarat & Formulir Pembeli
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-300">
                Penting
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tentukan data apa saja yang wajib diisi oleh pengunjung saat memesan tiket (misalnya: <strong>Nomor Induk Kependudukan (NIK/KTP)</strong>, <strong>Tanggal Lahir</strong>, <strong>Ukuran Kaos</strong>, atau <strong>Syarat & Ketentuan Tambahan</strong>).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-0 sm:pl-13">
          <Link href={`/dashboard/events/${eventId}/custom-fields`}>
            <Button
              type="button"
              className="bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-xs active:scale-95 border-0 py-2 px-3.5"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Buka Pengaturan Syarat Pembeli</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </Link>
          <Link href={`/dashboard/events/${eventId}/ticket-categories`}>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-2xs active:scale-95 py-2 px-3.5"
            >
              <Ticket className="w-3.5 h-3.5 text-slate-500" />
              <span>Atur Kategori Tiket</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
