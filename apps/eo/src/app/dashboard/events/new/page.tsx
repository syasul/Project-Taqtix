'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

// Validasi Form menggunakan Zod
const eventSchema = z.object({
  title: z.string().min(5, { message: 'Judul event minimal 5 karakter' }),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
  location: z.string().min(5, { message: 'Lokasi minimal 5 karakter' }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal mulai salah' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal selesai salah' }),
  bannerUrl: z.string().url({ message: 'URL banner tidak valid' }).or(z.literal('')),
  requireLogin: z.boolean().default(false),
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

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back Button */}
      <div>
        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Event</span>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Buat Event Baru
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Daftarkan event baru dengan mengisi detail di bawah. Event yang dibuat pertama kali berstatus draft.
        </p>
      </div>

      <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
        <CardHeader className="border-b border-slate-855 pb-4">
          <CardTitle className="text-lg font-bold text-slate-200">Form Detail Event</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Judul Event</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Taqwa Movement Concert 2026"
                        className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Deskripsi Lengkap</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Tuliskan rincian acara, pembicara/artis, syarat masuk..."
                        rows={5}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-2.5 text-slate-250 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Lokasi Penyelenggaraan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Jakarta Convention Center, Senayan, Jakarta"
                        className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Tanggal Mulai</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-800/30 border-slate-700 text-slate-250 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Tanggal Selesai</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-800/30 border-slate-700 text-slate-250 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">URL Banner Image (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: https://ik.imagekit.io/taqtix/concert-banner.jpg"
                        className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              {/* Requirement: Toggle Wajib Login Pengunjung */}
              <FormField
                control={form.control}
                name="requireLogin"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-bold text-slate-100 flex items-center gap-2 cursor-pointer">
                          <span>Wajibkan Pengunjung Login (Require Login)</span>
                          {field.value && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Aktif
                            </span>
                          )}
                        </FormLabel>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Jika diaktifkan, calon pembeli harus masuk (login) atau mendaftar akun TAQtix sebelum dapat menyelesaikan pemesanan tiket untuk event ini.
                        </p>
                      </div>
                      <FormControl>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                            field.value ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              field.value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
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
