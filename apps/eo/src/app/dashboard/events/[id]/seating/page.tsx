'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Armchair,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Ticket,
  Eye,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

// Validasi Form Generator Denah Kursi
const generateSeatsSchema = z.object({
  sectionName: z.string().min(2, { message: 'Nama seksi minimal 2 karakter' }),
  ticketCategoryId: z.string().min(1, { message: 'Pilih kategori tiket' }),
  stagePosition: z.string().default('CENTER'),
  rowStart: z.string().min(1, { message: 'Wajib diisi' }),
  rowEnd: z.string().min(1, { message: 'Wajib diisi' }),
  seatsPerRow: z.number().min(1).max(50, { message: 'Maksimal 50 kursi per baris' }),
  aisleAfterSeat: z.number().optional().nullable(),
});

type GenerateSeatsValues = z.infer<typeof generateSeatsSchema>;

interface Seat {
  id: string;
  row: string;
  col: number;
  seatNumber: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'DISABLED';
  ticketCategoryId: string;
}

interface SeatSection {
  id: string;
  name: string;
  stagePosition: string;
  ticketCategoryId?: string;
  ticketCategory?: {
    id: string;
    name: string;
    price: number;
  };
  seats: Seat[];
}

export default function SeatingLayoutWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = params?.id as string;

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Fetch Event detail
  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['organizer-event', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}`);
      return res.data?.data;
    },
    enabled: !!eventId,
  });

  // Fetch Ticket Categories untuk pilihan tier
  const { data: ticketCategories = [] } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/ticket-categories`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  // Fetch Seating Sections & Seats
  const { data: sections = [], isLoading: isSeatingLoading } = useQuery<SeatSection[]>({
    queryKey: ['organizer-seating', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/seating`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  // Toggle On/Off Has Seating Layout
  const toggleLayoutMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const res = await apiClient.patch(`/organizer/events/${eventId}`, {
        hasSeatingLayout: newValue,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      toast.success(
        data?.data?.hasSeatingLayout
          ? 'Sistem denah & nomor kursi diaktifkan!'
          : 'Sistem nomor kursi dinonaktifkan (mode General Admission)',
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah status denah');
    },
  });

  // Form hooks untuk generate denah baru
  const form = useForm<GenerateSeatsValues>({
    resolver: zodResolver(generateSeatsSchema),
    defaultValues: {
      sectionName: 'VIP Center',
      ticketCategoryId: ticketCategories[0]?.id || '',
      stagePosition: 'CENTER',
      rowStart: 'A',
      rowEnd: 'F',
      seatsPerRow: 12,
      aisleAfterSeat: 6,
    },
  });

  // Generator Mutation
  const generateMutation = useMutation({
    mutationFn: async (values: GenerateSeatsValues) => {
      const payload = {
        sectionName: values.sectionName,
        ticketCategoryId: values.ticketCategoryId,
        stagePosition: values.stagePosition,
        rowStart: values.rowStart,
        rowEnd: values.rowEnd,
        seatsPerRow: Number(values.seatsPerRow),
        aisleAfterSeats: values.aisleAfterSeat ? [Number(values.aisleAfterSeat)] : [],
      };
      const res = await apiClient.post(`/organizer/events/${eventId}/seating/generate`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Denah kursi berhasil digenerate!');
      queryClient.invalidateQueries({ queryKey: ['organizer-seating', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
      setIsGenerateDialogOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Gagal generate denah kursi');
    },
  });

  // Toggle Individual Seat Status (Available <-> Disabled)
  const toggleSeatMutation = useMutation({
    mutationFn: async (seatId: string) => {
      const res = await apiClient.patch(
        `/organizer/events/${eventId}/seating/seats/${seatId}/toggle`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-seating', eventId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah status kursi');
    },
  });

  // Delete Section Mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await apiClient.delete(
        `/organizer/events/${eventId}/seating/sections/${sectionId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Seksi denah berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['organizer-seating', eventId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Gagal menghapus seksi');
    },
  });

  // Kalkulasi statistik keseluruhan kursi
  const allSeats = sections.flatMap((s) => s.seats || []);
  const totalSeats = allSeats.length;
  const availableSeats = allSeats.filter((s) => s.status === 'AVAILABLE').length;
  const bookedSeats = allSeats.filter((s) => s.status === 'BOOKED').length;
  const lockedSeats = allSeats.filter((s) => s.status === 'LOCKED').length;
  const disabledSeats = allSeats.filter((s) => s.status === 'DISABLED').length;

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: event?.title || 'Event', href: `/dashboard/events/${eventId}` },
    { label: 'Denah & Nomor Kursi' },
  ];

  const hasSeatingLayout = Boolean(event?.hasSeatingLayout);

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <Breadcrumb items={breadcrumbs} />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#08B4B5] flex items-center justify-center">
              <Armchair className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Denah & Nomor Kursi Acara
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Atur layout tempat duduk untuk acara indoor, teater, bioskop, atau konser internasional.
          </p>
        </div>

        {/* Global On / Off Switch */}
        <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
          <div className="space-y-0.5 text-right">
            <span className="text-xs font-bold text-slate-900 block">
              {hasSeatingLayout ? 'Fitur Kursi Aktif' : 'Fitur Kursi Non-Aktif'}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {hasSeatingLayout ? 'Pembeli memilih nomor kursi' : 'General Admission (Tanpa kursi)'}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={hasSeatingLayout}
            disabled={toggleLayoutMutation.isPending}
            onClick={() => toggleLayoutMutation.mutate(!hasSeatingLayout)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hasSeatingLayout ? 'bg-[#08B4B5]' : 'bg-slate-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                hasSeatingLayout ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info Warning Jika Fitur Kursi Belum Aktif */}
      {!hasSeatingLayout && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Mode Nomor Kursi Saat Ini Sedang Non-Aktif (OFF)</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Calon pembeli saat ini membeli tiket dengan alur biasa (General Admission). Aktifkan toggle di kanan atas agar denah interaktif tampil di halaman tiket acara.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => toggleLayoutMutation.mutate(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
          >
            Aktifkan Sekarang
          </Button>
        </div>
      )}

      {/* 4 Statistik Kursi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Kursi
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {totalSeats.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">{sections.length} Seksi Terdaftar</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
            Kursi Tersedia
          </span>
          <p className="text-base sm:text-lg font-black text-emerald-600 font-mono">
            {availableSeats.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Siap dipesan pembeli</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
            Kursi Terjual
          </span>
          <p className="text-base sm:text-lg font-black text-rose-600 font-mono">
            {bookedSeats.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">{lockedSeats} sedang checkout</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Ruang Kosong / Tiang
          </span>
          <p className="text-base sm:text-lg font-black text-slate-500 font-mono">
            {disabledSeats.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Dinonaktifkan EO</p>
        </div>
      </div>

      {/* Action Bar & Tambah Seksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Denah Visual Panggung</h2>
          <span className="text-[10px] text-slate-400">
            (Klik kursi mana saja untuk menonaktifkan atau menjadikannya ruang kosong)
          </span>
        </div>

        <Button
          onClick={() => {
            if (ticketCategories.length === 0) {
              toast.error('Buat kategori tiket terlebih dahulu sebelum membuat denah kursi.');
              router.push(`/dashboard/events/${eventId}/ticket-categories`);
              return;
            }
            form.setValue('ticketCategoryId', ticketCategories[0]?.id || '');
            setIsGenerateDialogOpen(true);
          }}
          className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate Denah Kursi Otomatis</span>
        </Button>
      </div>

      {/* Visual Canvas Stage & Seats */}
      <Card className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border-slate-800 shadow-md overflow-x-auto">
        {/* Panggung / Stage Display */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative py-2.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500/20 via-[#08B4B5]/40 to-teal-500/20 border border-teal-500/40 text-center shadow-lg backdrop-blur-sm">
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-teal-200">
              🎭 PANGGUNG / STAGE ACARA
            </span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#08B4B5] rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Sections and Grids */}
        {isSeatingLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[#08B4B5]" />
            <span>Memuat denah kursi...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Armchair className="w-7 h-7 text-[#08B4B5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Belum Ada Denah Kursi</h3>
              <p className="text-xs text-slate-400">
                Gunakan fitur generator otomatis di bawah untuk membuat denah kursi VIP, CAT 1, atau tribun hanya dalam beberapa detik.
              </p>
            </div>
            <Button
              onClick={() => {
                if (ticketCategories.length === 0) {
                  toast.error('Buat kategori tiket terlebih dahulu.');
                  router.push(`/dashboard/events/${eventId}/ticket-categories`);
                  return;
                }
                form.setValue('ticketCategoryId', ticketCategories[0]?.id || '');
                setIsGenerateDialogOpen(true);
              }}
              variant="outline"
              className="border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 rounded-xl text-xs font-bold cursor-pointer"
            >
              + Buat Denah Kursi Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => {
              // Kelompokkan kursi berdasarkan baris (Row A, B, C...)
              const rowMap: Record<string, Seat[]> = {};
              section.seats.forEach((seat) => {
                if (!rowMap[seat.row]) rowMap[seat.row] = [];
                rowMap[seat.row].push(seat);
              });

              return (
                <div
                  key={section.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#08B4B5]" />
                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        {section.name}
                      </h3>
                      {section.ticketCategory && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          Tier: {section.ticketCategory.name} •{' '}
                          {section.ticketCategory.price.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {section.seats.filter((s) => s.status === 'AVAILABLE').length} dari{' '}
                        {section.seats.length} kursi aktif
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (
                            confirm(
                              `Apakah Anda yakin ingin menghapus seksi "${section.name}" beserta semua kursinya?`,
                            )
                          ) {
                            deleteSectionMutation.mutate(section.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2 rounded-lg text-xs cursor-pointer gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Seksi</span>
                      </Button>
                    </div>
                  </div>

                  {/* Seat Grid Rows */}
                  <div className="overflow-x-auto py-2">
                    <div className="flex flex-col items-center gap-2.5 min-w-max">
                      {Object.keys(rowMap)
                        .sort()
                        .map((rowLabel) => {
                          const seatsInRow = rowMap[rowLabel].sort((a, b) => a.col - b.col);

                          return (
                            <div key={rowLabel} className="flex items-center gap-2">
                              {/* Row Label Left */}
                              <span className="w-6 text-center text-xs font-bold font-mono text-slate-400 select-none">
                                {rowLabel}
                              </span>

                              {/* Seats in Row */}
                              <div className="flex items-center gap-1.5">
                                {seatsInRow.map((seat) => {
                                  const isAvailable = seat.status === 'AVAILABLE';
                                  const isBooked = seat.status === 'BOOKED';
                                  const isLocked = seat.status === 'LOCKED';
                                  const isDisabled = seat.status === 'DISABLED';

                                  return (
                                    <button
                                      key={seat.id}
                                      type="button"
                                      title={`Kursi ${seat.seatNumber} (${seat.status}) - Klik untuk toggle aktif/ruang kosong`}
                                      disabled={isBooked || isLocked}
                                      onClick={() => toggleSeatMutation.mutate(seat.id)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                                        isBooked
                                          ? 'bg-rose-600/70 text-white cursor-not-allowed border border-rose-500/30'
                                          : isLocked
                                            ? 'bg-amber-500/70 text-slate-950 font-extrabold cursor-not-allowed border border-amber-400'
                                            : isDisabled
                                              ? 'bg-transparent border border-dashed border-slate-700 text-slate-600 opacity-40 hover:opacity-100'
                                              : 'bg-teal-500/20 hover:bg-[#08B4B5] text-teal-200 hover:text-white border border-teal-500/40 hover:scale-105 active:scale-95'
                                      }`}
                                    >
                                      {isDisabled ? '✕' : seat.col}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Row Label Right */}
                              <span className="w-6 text-center text-xs font-bold font-mono text-slate-400 select-none">
                                {rowLabel}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legenda Warna Kursi */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-teal-500/30 border border-teal-500/50" />
            <span>Tersedia (Tersedia untuk dipesan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-amber-500/70 border border-amber-400" />
            <span>Terkunci (Sedang Checkout 10 Menit)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-rose-600/70 border border-rose-500" />
            <span>Terjual (Sudah Lunas)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md border border-dashed border-slate-700 text-slate-500 flex items-center justify-center text-[9px]">
              ✕
            </span>
            <span>Dinonaktifkan (Ruang Kosong / Tiang)</span>
          </div>
        </div>
      </Card>

      {/* Dialog Modal Generator Denah Kursi Otomatis */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#08B4B5]" />
              <span>Generator Denah Kursi Otomatis</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat ratusan nomor kursi secara otomatis dan teratur dalam hitungan detik.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => generateMutation.mutate(v))} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="sectionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nama Seksi / Blok *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: VIP Depan, CAT 1 Sayap Kiri, Tribun"
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticketCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kategori / Tier Tiket *
                    </FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:outline-none"
                        {...field}
                      >
                        <option value="">-- Pilih Tier Tiket --</option>
                        {ticketCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} (
                            {cat.price.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                            )
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="rowStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Baris Awal *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A atau 1"
                          maxLength={3}
                          className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs font-mono uppercase text-center"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rowEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Baris Akhir *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="H atau 10"
                          maxLength={3}
                          className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs font-mono uppercase text-center"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="seatsPerRow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kursi / Baris *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          placeholder="Contoh: 16"
                          className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs font-mono text-center"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aisleAfterSeat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Lorong Jalan
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Setelah kursi ke-..."
                          className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs font-mono text-center"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsGenerateDialogOpen(false)}
                  className="rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Kursi</span>
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
