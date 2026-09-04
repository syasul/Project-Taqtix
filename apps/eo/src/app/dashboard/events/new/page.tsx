'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, PlusCircle } from 'lucide-react';
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

export default function CreateEventPage() {
  const router = useRouter();

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
                        placeholder="Contoh: https://ik.imagekit.io/taqtix/concert-banner.jpg"
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
