'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Ticket, ShieldAlert, ArrowLeft, Plus, Minus, Lock, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
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

interface LineUpItem {
  id: string;
  name: string;
  photoUrl: string | null;
  performTime: string | null;
  stage: string | null;
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
  requireLogin?: boolean;
  organizer: {
    name: string;
  };
  ticketCategories: TicketCategory[];
  lineup?: LineUpItem[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const { user } = useAuth();

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
    const checkoutUrl = `/checkout?eventId=${event.id}&items=${serializedItems}`;

    // Cek jika event mewajibkan login dan user belum login
    if (event.requireLogin && !user) {
      toast.info('Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu.');
      router.push(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    router.push(checkoutUrl);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-8 w-1/4 bg-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-80 w-full bg-slate-100 rounded-2xl" />
            <Skeleton className="h-40 w-full bg-slate-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-60 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Event Tidak Ditemukan</h2>
        <p className="text-slate-500">Event yang Anda cari tidak ada atau belum dipublikasikan.</p>
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
          className="text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded-xl -ml-2 gap-2 cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Detail Event (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Banner */}
          <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
            {event.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-indigo-500/50" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{event.title}</h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-2">
                Diselenggarakan oleh: {event.organizer.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-200 py-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Tanggal & Waktu</h4>
                  <p className="text-slate-800 font-semibold">{formattedDateRange}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Lokasi Penyelenggaraan</h4>
                  <p className="text-slate-800 font-semibold">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Deskripsi Event</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Line Up Performers */}
            {event.lineup && event.lineup.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>Bintang Tamu & Pengisi Acara (Line Up)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {event.lineup.map((artist) => (
                    <div
                      key={artist.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center flex flex-col items-center space-y-2"
                    >
                      {artist.photoUrl ? (
                        <img
                          src={artist.photoUrl}
                          alt={artist.name}
                          className="h-20 w-20 rounded-full object-cover border border-indigo-200 shadow-sm"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-lg border border-indigo-200">
                          {artist.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{artist.name}</h4>
                        {artist.performTime && (
                          <span className="text-[10px] text-indigo-600 font-semibold block">
                            {artist.performTime}
                          </span>
                        )}
                        {artist.stage && (
                          <span className="text-[9px] text-slate-400 block font-medium">
                            {artist.stage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kategori Tiket & Checkout (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-indigo-600" />
                <span>Pilih Kategori Tiket</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {event.requireLogin && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">Wajib Masuk Akun</span>
                    <span className="text-[11px] text-amber-800 leading-tight">
                      Pemesanan tiket event ini mewajibkan Anda untuk masuk (login) akun TAQtix.
                    </span>
                  </div>
                </div>
              )}

              {event.ticketCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Kategori tiket belum tersedia.</p>
              ) : (
                <div className="space-y-4">
                  {event.ticketCategories.map((category) => {
                    const selected = quantities[category.id] || 0;
                    const remaining = category.quota - category.sold;
                    const isSoldOut = remaining <= 0;

                    return (
                      <div
                        key={category.id}
                        className="flex flex-col justify-between p-4 border border-slate-200 hover:border-slate-350 bg-slate-50/50 rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">{category.name}</h4>
                            <span className="text-indigo-600 text-xs font-semibold">
                              {category.price.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          {isSoldOut ? (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Habis
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-450">
                              Sisa {remaining} kuota
                            </span>
                          )}
                        </div>

                        {!isSoldOut && (
                          <div className="flex justify-end items-center space-x-3">
                            <button
                              onClick={() => handleQtyChange(category.id, -1, category.maxPerOrder)}
                              disabled={selected === 0}
                              className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
                            >
                              <Minus className="h-4 w-4 text-slate-600" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs sm:text-sm text-slate-800">
                              {selected}
                            </span>
                            <button
                              onClick={() => handleQtyChange(category.id, 1, Math.min(remaining, category.maxPerOrder))}
                              disabled={selected >= Math.min(remaining, category.maxPerOrder)}
                              className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
                            >
                              <Plus className="h-4 w-4 text-slate-600" />
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
                <div className="border-t border-slate-200 pt-4 flex flex-col space-y-4">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Total Harga</span>
                    <span className="text-base sm:text-lg font-extrabold text-indigo-650">
                      {totalCost.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-[0.98] border-0"
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
