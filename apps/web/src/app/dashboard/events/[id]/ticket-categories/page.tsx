'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Edit2, Loader2, Calendar, Ticket, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Validasi Zod
const categorySchema = z.object({
  name: z.string().min(3, { message: 'Nama kategori minimal 3 karakter' }),
  price: z.number().min(0, { message: 'Harga tidak boleh kurang dari 0' }),
  quota: z.number().min(1, { message: 'Kuota minimal harus 1' }),
  saleStart: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal mulai tidak valid' }),
  saleEnd: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal selesai tidak valid' }),
}).refine((data) => {
  return new Date(data.saleEnd) > new Date(data.saleStart);
}, {
  message: 'Selesai penjualan harus lebih lambat dari mulai penjualan',
  path: ['saleEnd'],
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  saleStartAt: string;
  saleEndAt: string;
}

export default function TicketCategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = params?.id as string;

  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);

  // Fetch Event details
  const { data: eventResponse } = useQuery({
    queryKey: ['organizer-event-detail', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  // Fetch Ticket Categories
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/ticket-categories`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  const categories: TicketCategory[] = categoriesResponse || [];

  // Form hooks untuk category baru
  const newForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      price: 0,
      quota: 0,
      saleStart: '',
      saleEnd: '',
    },
  });

  // Form hooks untuk edit category
  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  // Mutation Tambah Category
  const addMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = {
        name: values.name,
        price: values.price,
        quota: values.quota,
        saleStart: new Date(values.saleStart).toISOString(),
        saleEnd: new Date(values.saleEnd).toISOString(),
      };
      const res = await apiClient.post(`/organizer/events/${eventId}/ticket-categories`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Kategori tiket berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
      newForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal menambahkan kategori tiket.');
    },
  });

  // Mutation Edit Category
  const updateMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (!editingCategory) return;
      const payload = {
        name: values.name,
        price: values.price,
        quota: values.quota,
        saleStart: new Date(values.saleStart).toISOString(),
        saleEnd: new Date(values.saleEnd).toISOString(),
      };
      const res = await apiClient.patch(`/organizer/ticket-categories/${editingCategory.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Kategori tiket berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal memperbarui kategori tiket.');
    },
  });

  const handleOpenEdit = (category: TicketCategory) => {
    setEditingCategory(category);
    
    const toLocalString = (dateStr: string) => {
      const d = new Date(dateStr);
      const tzoffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    editForm.reset({
      name: category.name,
      price: category.price,
      quota: category.quota,
      saleStart: toLocalString(category.saleStartAt),
      saleEnd: toLocalString(category.saleEndAt),
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
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
          Kelola Kategori Tiket
        </h1>
        {eventResponse && (
          <p className="text-sm text-slate-400 mt-2">
            Event: <span className="font-bold text-slate-300">{eventResponse.title}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* List of categories */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">Kategori Tiket Aktif</h3>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-855 rounded-2xl bg-slate-900/10 text-slate-500 text-xs">
              Belum ada kategori tiket terdaftar. Gunakan panel di sebelah kanan untuk menambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {categories.map((category) => {
                const percent = Math.min((category.sold / category.quota) * 100, 100);
                const startStr = format(new Date(category.saleStartAt), 'd MMM yyyy, HH:mm', { locale: localeId });
                const endStr = format(new Date(category.saleEndAt), 'd MMM yyyy, HH:mm', { locale: localeId });

                return (
                  <Card key={category.id} className="bg-slate-900/40 border-slate-855 p-6 relative group overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-205 flex items-center gap-2">
                          <Ticket className="h-4.5 w-4.5 text-indigo-400" />
                          <span>{category.name}</span>
                        </h4>
                        <p className="text-xs font-semibold text-emerald-400 font-mono">
                          {category.price.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleOpenEdit(category)}
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-1.5 h-8 w-8 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Kuota Terjual</span>
                        <span className="text-slate-350 font-mono">
                          {category.sold} / {category.quota} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 pt-3 border-t border-slate-855/50 flex flex-wrap gap-x-6 text-[10px] text-slate-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Mulai: {startStr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Selesai: {endStr}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add category panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-slate-855 pb-4">
              <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                <span>Tambah Kategori Baru</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...newForm}>
                <form onSubmit={newForm.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={newForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">Nama Kategori Tiket</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: VIP, Early Bird"
                            className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">Harga Tiket (Rupiah)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="quota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">Kuota Kapasitas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="saleStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">Mulai Penjualan</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="saleEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">Selesai Penjualan</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-800/30 border-slate-700 text-slate-255 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Tambah Kategori</span>
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Category Modal Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Edit Kategori Tiket</DialogTitle>
            <DialogDescription className="text-xs text-slate-450">
              Modifikasi detail kapasitas kuota dan waktu aktif kategori.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4 mt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-400">Nama Kategori</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-slate-800 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Harga (Rupiah)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-slate-800 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="quota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Kuota</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-slate-800 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="saleStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Mulai Penjualan</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-800 border-slate-700 text-slate-250 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="saleEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Selesai Penjualan</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-800 border-slate-700 text-slate-255 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-850">
                <Button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  variant="ghost"
                  className="hover:bg-slate-800 rounded-xl text-xs cursor-pointer font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 px-4"
                >
                  {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
