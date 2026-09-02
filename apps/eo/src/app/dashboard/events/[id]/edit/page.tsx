'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, Send, ShieldAlert } from 'lucide-react';
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
      <div className="max-w-3xl mx-auto py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100">Event Tidak Ditemukan</h2>
        <p className="text-slate-400">Event yang ingin Anda ubah tidak terdaftar atau tidak dimiliki oleh akun Anda.</p>
        <Button onClick={() => router.push('/dashboard/events')} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer">
          Kembali ke Daftar Event
        </Button>
      </div>
    );
  }

  const isDraft = event.status.toUpperCase() === 'DRAFT';

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>

        {isDraft && (
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold gap-2 cursor-pointer text-xs py-2 px-4 shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
          >
            {publishMutation.isPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
            <span>Publikasikan Event</span>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Ubah Detail Event
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Ubah detail kelayakan event. Status saat ini:{' '}
          <span className="font-bold text-slate-355 uppercase">{event.status}</span>
        </p>
      </div>

      <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
        <CardHeader className="border-b border-slate-855 pb-4">
          <CardTitle className="text-lg font-bold text-slate-200">Edit Detail</CardTitle>
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
                          className="bg-slate-800/30 border-slate-700 text-slate-255 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl font-mono text-sm"
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
                disabled={updateMutation.isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
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
