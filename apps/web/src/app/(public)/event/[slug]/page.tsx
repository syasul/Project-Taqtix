'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Ticket, ShieldAlert, ArrowLeft, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  maxPerOrder: number;
  saleStartAt: string;
  saleEndAt: string;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  organizer: {
    name: string;
  };
  ticketCategories: TicketCategory[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Tangkap affiliate partner code (?aff=...) jika di-share
  const affCode = searchParams?.get('aff') || '';

  const { data: eventResponse, isLoading, error } = useQuery({
    queryKey: ['public-event', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });

  const event: EventDetail | null = eventResponse?.data || null;

  // State untuk menyimpan kuantitas tiket terpilih per kategori: { [categoryId]: qty }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQtyChange = (categoryId: string, delta: number, max: number) => {
    const current = quantities[categoryId] || 0;
    const next = Math.max(0, Math.min(max, current + delta));
    setQuantities((prev) => ({
      ...prev,
      [categoryId]: next,
    }));
  };

  const selectedItems = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => ({ categoryId: id, qty }));

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Silakan pilih minimal 1 kategori tiket untuk melanjutkan.');
      return;
    }

    if (!event) return;

    // Simpan affiliate partner code ke localStorage jika ada
    if (affCode) {
      localStorage.setItem(`taqtix_aff_${event.id}`, affCode);
    }

    // Serialize parameter checkout
    const serializedItems = selectedItems.map((item) => `${item.categoryId}:${item.qty}`).join(',');
    router.push(`/checkout?eventId=${event.id}&items=${serializedItems}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-8 w-1/4 bg-slate-900" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-80 w-full bg-slate-900 rounded-2xl" />
            <Skeleton className="h-40 w-full bg-slate-900 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-60 w-full bg-slate-900 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100">Event Tidak Ditemukan</h2>
        <p className="text-slate-400">Event yang Anda cari tidak ada atau belum dipublikasikan.</p>
        <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer">
          Kembali ke Discovery
        </Button>
      </div>
    );
  }

  const formattedDateRange = `${format(new Date(event.startDate), 'd MMMM yyyy', {
    locale: localeId,
  })} s/d ${format(new Date(event.endDate), 'd MMMM yyyy', { locale: localeId })}`;

  const totalCost = selectedItems.reduce((sum, item) => {
    const category = event.ticketCategories.find((c) => c.id === item.categoryId);
    return sum + (category ? category.price * item.qty : 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button */}
      <div>
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Detail Event (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Banner */}
          <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-850">
            {event.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-indigo-500/35" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-6 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">{event.title}</h1>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-2">
                Diselenggarakan oleh: {event.organizer.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-855 py-4 text-sm text-slate-300">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-500 uppercase">Tanggal & Waktu</h4>
                  <p className="text-slate-300 font-medium">{formattedDateRange}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-500 uppercase">Lokasi Penyelenggaraan</h4>
                  <p className="text-slate-300 font-medium">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-200">Deskripsi Event</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </div>
        </div>

        {/* Kategori Tiket & Checkout (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-slate-855 pb-4">
              <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-indigo-400" />
                <span>Pilih Kategori Tiket</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {event.ticketCategories.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Kategori tiket belum tersedia.</p>
              ) : (
                <div className="space-y-4">
                  {event.ticketCategories.map((category) => {
                    const selected = quantities[category.id] || 0;
                    const remaining = category.quota - category.sold;
                    const isSoldOut = remaining <= 0;

                    return (
                      <div
                        key={category.id}
                        className="flex flex-col justify-between p-4 border border-slate-855/60 hover:border-slate-800 bg-slate-900/20 rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{category.name}</h4>
                            <span className="text-slate-400 text-xs font-mono">
                              {category.price.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          {isSoldOut ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Habis
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500">
                              Sisa {remaining} kuota
                            </span>
                          )}
                        </div>

                        {!isSoldOut && (
                          <div className="flex justify-end items-center space-x-3">
                            <button
                              onClick={() => handleQtyChange(category.id, -1, category.maxPerOrder)}
                              disabled={selected === 0}
                              className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-750 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Minus className="h-4.5 w-4.5 text-slate-300" />
                            </button>
                            <span className="w-6 text-center font-bold text-sm text-slate-200 font-mono">
                              {selected}
                            </span>
                            <button
                              onClick={() => handleQtyChange(category.id, 1, Math.min(remaining, category.maxPerOrder))}
                              disabled={selected >= Math.min(remaining, category.maxPerOrder)}
                              className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-750 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Plus className="h-4.5 w-4.5 text-slate-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {totalCost > 0 && (
                <div className="border-t border-slate-855 pt-4 flex flex-col space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Total Harga</span>
                    <span className="text-base font-extrabold text-indigo-400 font-mono">
                      {totalCost.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98]"
                  >
                    Lanjutkan ke Checkout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
