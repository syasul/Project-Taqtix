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
import { Breadcrumb } from '@/components/ui/breadcrumb';
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

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: eventResponse?.title || 'Event', href: `/dashboard/events/${eventId}/sales` },
    { label: 'Kategori Tiket' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#08B4B5]" />
            Kelola Kategori Tiket
          </h1>
          {eventResponse && (
            <p className="text-xs text-slate-500 mt-1">
              Event: <span className="font-bold text-slate-700">{eventResponse.title}</span>
            </p>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List of categories */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Kategori Tiket Aktif</h3>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-400 text-xs shadow-sm">
              Belum ada kategori tiket terdaftar. Gunakan panel di sebelah kanan untuk menambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {categories.map((category) => {
                const percent = Math.min((category.sold / category.quota) * 100, 100);
                const startStr = format(new Date(category.saleStartAt), 'd MMM yyyy, HH:mm', { locale: localeId });
                const endStr = format(new Date(category.saleEndAt), 'd MMM yyyy, HH:mm', { locale: localeId });

                return (
                  <Card key={category.id} className="bg-white border-slate-200 p-6 relative group overflow-hidden shadow-sm rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Ticket className="h-4.5 w-4.5 text-[#08B4B5]" />
                          <span>{category.name}</span>
                        </h4>
                        <p className="text-xs font-bold text-emerald-600 font-mono">
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
                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl p-1.5 h-8 w-8 cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Kuota Terjual</span>
                        <span className="text-slate-700 font-mono font-bold">
                          {category.sold} / {category.quota} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className="bg-[#08B4B5] h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-6 text-[10px] text-slate-400 font-mono">
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
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4 p-5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#08B4B5]" />
                <span>Tambah Kategori Baru</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Form {...newForm}>
                <form onSubmit={newForm.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={newForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Kategori</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: VIP, Early Bird"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Harga Tiket (Rupiah)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="quota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kuota Kapasitas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="saleStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mulai Penjualan</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="saleEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selesai Penjualan</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-0"
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
        <DialogContent className="bg-white border-slate-200 text-slate-900 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Kategori Tiket</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modifikasi detail kapasitas kuota dan waktu aktif kategori.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4 mt-2">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Kategori</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Harga (Rupiah)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="quota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kuota</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="saleStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mulai Penjualan</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="saleEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selesai Penjualan</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs font-mono py-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-100 rounded-xl text-xs cursor-pointer font-bold text-slate-600"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 px-4 shadow-sm border-0"
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
