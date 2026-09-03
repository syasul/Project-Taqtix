'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Plus, Copy, Link as LinkIcon, HeartHandshake, Percent, TrendingUp, Trophy } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

// Validasi Form menggunakan Zod
const partnerSchema = z.object({
  name: z.string().min(3, { message: 'Nama partner minimal 3 karakter' }),
  type: z.enum(['AMBASSADOR', 'COMMUNITY', 'INFLUENCER', 'CORPORATE'], {
    errorMap: () => ({ message: 'Pilih tipe partner yang valid' }),
  }),
  commissionPct: z.number().min(0).max(100, { message: 'Komisi berkisar antara 0 - 100%' }),
  promoCode: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface Partner {
  id: string;
  name: string;
  type: 'AMBASSADOR' | 'COMMUNITY' | 'INFLUENCER' | 'CORPORATE';
  uniqueCode: string;
  promoCode: string | null;
  commissionType: string;
  commissionValue: number;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  createdAt: string;
}

export default function AffiliatePartnersPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = params?.id as string;

  const [isOpen, setIsOpen] = useState(false);

  // 1. Fetch Partners List
  const { data: partnersResponse, isLoading: listLoading } = useQuery({
    queryKey: ['event-partners', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/partners`);
      return res.data?.data as Partner[];
    },
    enabled: !!eventId,
  });

  const partners = partnersResponse || [];

  // 2. Fetch Leaderboard List
  const { data: leaderboardResponse } = useQuery({
    queryKey: ['event-partners-leaderboard', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/partners/leaderboard`);
      return res.data?.data as Partner[];
    },
    enabled: !!eventId,
  });

  const leaderboard = leaderboardResponse || [];

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      type: 'INFLUENCER',
      commissionPct: 10,
      promoCode: '',
    },
  });

  // Mutation Tambah Partner
  const addMutation = useMutation({
    mutationFn: async (values: PartnerFormValues) => {
      const res = await apiClient.post(`/organizer/events/${eventId}/partners`, values);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Partner afiliasi berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['event-partners', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-partners-leaderboard', eventId] });
      form.reset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal menambahkan partner.');
    },
  });

  const handleCopyLink = (code: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const cleanBaseUrl = apiBaseUrl.endsWith('/v1') ? apiBaseUrl.slice(0, -3) : apiBaseUrl;
    const redirectUrl = `${cleanBaseUrl}/v1/r/${code}`;
    
    navigator.clipboard.writeText(redirectUrl);
    toast.success('Tautan afiliasi unik berhasil disalin!');
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Mitra & Afiliasi Event' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-[#08B4B5]" />
            Manajemen Partner & Afiliasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tambahkan duta promosi (Ambassador/Influencer), salin tautan pelacakan klik, dan hitung komisi konversi penjualan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl gap-2 font-bold cursor-pointer text-xs py-2.5 px-4 shadow-sm active:scale-[0.98] border-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Partner</span>
          </Button>
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

      {/* Leaderboard Summary */}
      {leaderboard.length > 0 && (
        <Card className="bg-white border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mitra Afiliasi Terbaik</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Performa konversi tertinggi dipegang oleh:{' '}
                <strong className="text-[#08B4B5]">{leaderboard[0].name}</strong> dengan{' '}
                <strong className="font-mono text-slate-900">{leaderboard[0].conversions}</strong> tiket terjual.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Table List */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-5">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-[#08B4B5]" />
            <span>Daftar Mitra Terdaftar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada mitra afiliasi terdaftar untuk event ini.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <Table className="min-w-full">
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="py-3.5 px-6 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Nama Partner</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Tipe</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Klik / Konversi</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Revenue</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Komisi</TableHead>
                    <TableHead className="py-3.5 px-6 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">Tautan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => {
                    const clickCount = partner.clicks;
                    const conversionRate = clickCount > 0 ? ((partner.conversions / clickCount) * 100).toFixed(1) : '0';

                    return (
                      <TableRow key={partner.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-bold text-slate-900 text-xs">{partner.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CODE: {partner.uniqueCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-[10px] font-bold text-[#08B4B5] bg-teal-50 border border-[#08B4B5]/30 px-2 py-0.5 rounded-full uppercase">
                            {partner.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-semibold text-slate-700">
                              {clickCount} klik / {partner.conversions} sales
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Rate: {conversionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                          {partner.revenueGenerated.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col space-y-0.5 font-mono">
                            <span className="font-bold text-emerald-600">
                              {partner.commissionEarned.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans">
                              Rate: {partner.commissionValue}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button
                            onClick={() => handleCopyLink(partner.uniqueCode)}
                            size="sm"
                            className="bg-slate-50 hover:bg-[#08B4B5] text-slate-700 hover:text-white border border-slate-200 rounded-xl gap-1 text-xs cursor-pointer font-bold px-3 py-1.5 shadow-xs"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin Link</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Partner Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Daftarkan Partner Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat link pelacakan unik dan atur persentase komisi per tiket terjual.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4 mt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Partner / Afiliasi *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Influencer Dakwah, Budi Santoso"
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
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipe Partner</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl focus:border-[#08B4B5] focus:bg-white">
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs">
                          <SelectItem value="AMBASSADOR">Ambassador</SelectItem>
                          <SelectItem value="COMMUNITY">Community</SelectItem>
                          <SelectItem value="INFLUENCER">Influencer</SelectItem>
                          <SelectItem value="CORPORATE">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-rose-500 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Komisi Penjualan (%) *</FormLabel>
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

              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kode Promo Terkait (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: BUDIS10"
                        className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs uppercase py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-100 rounded-xl text-xs cursor-pointer font-bold text-slate-600"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 px-4 shadow-sm border-0"
                >
                  {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Daftarkan</span>
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
