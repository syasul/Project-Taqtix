'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, Send, ShieldAlert, Edit3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
const eventSchema = z.object({
  title: z.string().min(5, { message: 'Judul event minimal 5 karakter' }),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
  location: z.string().min(5, { message: 'Lokasi minimal 5 karakter' }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal mulai salah' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal selesai salah' }),
  bannerUrl: z.string().url({ message: 'URL banner tidak valid' }).or(z.literal('')),
  requireLogin: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: 'Tanggal selesai harus lebih lambat dari tanggal mulai',
  path: ['endDate'],
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
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
          const d = new Date(dateStr);
          const tzoffset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
          return localISOTime;
        };

        form.reset({
          title: found.title,
          description: found.description || '',
          location: found.location,
          startDate: toLocalString(found.startDate),
          endDate: toLocalString(found.endDate),
          bannerUrl: found.bannerUrl || '',
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
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

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

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL Banner Image (Opsional)</FormLabel>
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
    </div>
  );
}
