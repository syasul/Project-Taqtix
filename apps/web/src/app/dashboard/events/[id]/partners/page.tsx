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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const redirectUrl = `${apiBaseUrl.replace('/api/v1', '')}/v1/r/${code}`;
    
    navigator.clipboard.writeText(redirectUrl);
    toast.success('Tautan afiliasi unik berhasil disalin!');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Event</span>
        </Button>

        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl gap-2 font-bold cursor-pointer text-xs py-2 px-4 shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Tambah Partner</span>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Manajemen Partner & Afiliasi
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Tambahkan duta promosi (Ambassador/Influencer), salin tautan pelacakan klik, dan hitung komisi konversi penjualan.
        </p>
      </div>

      {/* Leaderboard Summary */}
      {leaderboard.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">Mitra Afiliasi Terbaik</h3>
              <p className="text-xs text-slate-450 mt-1">
                Performa konversi tertinggi dipegang oleh:{' '}
                <span className="font-bold text-indigo-400">{leaderboard[0].name}</span> dengan{' '}
                <span className="font-mono text-slate-200 font-semibold">{leaderboard[0].conversions}</span> tiket terjual.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Table List */}
      <Card className="bg-slate-900/40 border-slate-855 shadow-xl">
        <CardHeader className="border-b border-slate-855 pb-4">
          <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-indigo-400" />
            <span>Daftar Mitra Terdaftar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Belum ada mitra afiliasi terdaftar untuk event ini.
            </div>
          ) : (
            <div className="overflow-x-auto text-slate-300">
              <Table className="min-w-full text-xs">
                <TableHeader className="bg-slate-950/40 border-b border-slate-855">
                  <TableRow className="border-b border-slate-855">
                    <TableHead className="py-4 px-6 text-slate-400">Nama Partner</TableHead>
                    <TableHead className="py-4 px-4 text-slate-400">Tipe</TableHead>
                    <TableHead className="py-4 px-4 text-slate-400">Klik / Konversi</TableHead>
                    <TableHead className="py-4 px-4 text-slate-400">Revenue</TableHead>
                    <TableHead className="py-4 px-4 text-slate-400">Komisi</TableHead>
                    <TableHead className="py-4 px-6 text-slate-400 text-right">Tautan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => {
                    const clickCount = partner.clicks;
                    const conversionRate = clickCount > 0 ? ((partner.conversions / clickCount) * 100).toFixed(1) : '0';

                    return (
                      <TableRow key={partner.id} className="border-b border-slate-855/50 hover:bg-slate-900/20 transition">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col space-y-1">
                            <span className="font-bold text-slate-200 text-sm">{partner.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">CODE: {partner.uniqueCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                            {partner.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-semibold text-slate-300">
                              {clickCount} klik / {partner.conversions} sales
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">Rate: {conversionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-mono font-semibold text-slate-350">
                          {partner.revenueGenerated.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col space-y-0.5 font-mono">
                            <span className="font-semibold text-indigo-400">
                              {partner.commissionEarned.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              Rate: {partner.commissionValue}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button
                            onClick={() => handleCopyLink(partner.uniqueCode)}
                            size="sm"
                            className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg gap-1 text-xs cursor-pointer font-bold px-3 py-1.5"
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
        <DialogContent className="bg-slate-900 border-slate-855 text-slate-200">
          <DialogHeader>
            <DialogTitle>Daftarkan Partner Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-455">
              Buat link pelacakan unik dan atur persentase komisi per tiket terjual.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-400">Nama Partner / Afiliasi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Influencer Hijrah, Budi Santoso"
                        className="bg-slate-800 border-slate-700 text-slate-205 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Tipe Partner</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-slate-750 text-slate-250 text-xs rounded-xl focus:border-indigo-500">
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-855 text-slate-250 text-xs">
                          <SelectItem value="AMBASSADOR">Ambassador</SelectItem>
                          <SelectItem value="COMMUNITY">Community</SelectItem>
                          <SelectItem value="INFLUENCER">Influencer</SelectItem>
                          <SelectItem value="CORPORATE">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-400">Komisi Penjualan (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-slate-800 border-slate-755 text-slate-205 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs font-mono py-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-400">Kode Promo Terkait (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: BUDIS10"
                        className="bg-slate-800 border-slate-700 text-slate-205 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-xs uppercase py-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-850">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  className="hover:bg-slate-800 rounded-xl text-xs cursor-pointer font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 px-4"
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
