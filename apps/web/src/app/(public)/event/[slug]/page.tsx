'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Ticket,
  ShieldAlert,
  ArrowLeft,
  Plus,
  Minus,
  Lock,
  Tag,
  Zap,
  Clock,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Info,
  CreditCard,
  Smartphone,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
  BadgeCheck,
  Navigation,
  MessageCircle,
  ArrowRight,
  Users,
  Mic2,
  Globe,
} from 'lucide-react';
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
  socialUrl?: string | null;
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
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  adminSeoKeywords?: string;
  seoPriority?: string;
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Tangkap affiliate partner code (?ref=... atau ?aff=...) jika di-share
  const affCode = searchParams?.get('ref') || searchParams?.get('aff') || '';

  // Trigger tracking klik afiliasi secara asynchronous saat landing page diakses
  React.useEffect(() => {
    if (affCode) {
      apiClient.post(`/track/click/${affCode}`).catch((err) => {
        console.warn('Gagal mencatat tracking klik afiliasi:', err);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('taqtix_partner_ref', affCode);
        document.cookie = `taqtix_partner_ref=${affCode}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }
  }, [affCode]);

  const { data: eventResponse, isLoading, error } = useQuery({
    queryKey: ['public-event', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });

  const event: EventDetail | null = eventResponse?.data || null;

  // Sinkronkan cookie/localStorage spesifik event saat event data termuat
  React.useEffect(() => {
    if (event && affCode) {
      localStorage.setItem(`taqtix_aff_${event.id}`, affCode);
      document.cookie = `taqtix_aff_${event.id}=${affCode}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }, [event, affCode]);

  // Track page view event sekali saat event berhasil dimuat
  React.useEffect(() => {
    if (event?.id) {
      apiClient.post('/track/page-view', { eventId: event.id }).catch(() => {});
    }
  }, [event?.id]);

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Tautan event berhasil disalin ke papan klip!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined' && event) {
      const text = encodeURIComponent(
        `Yuk hadiri acara "${event.title}"!\nPesan tiket resmi sekarang di TAQtix:\n${window.location.href}`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Silakan pilih minimal 1 kategori tiket untuk melanjutkan.');
      return;
    }

    if (!event) return;

    const activeRef =
      affCode ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(`taqtix_aff_${event.id}`) || localStorage.getItem('taqtix_partner_ref')
        : '');
    if (activeRef) {
      localStorage.setItem(`taqtix_aff_${event.id}`, activeRef);
      document.cookie = `taqtix_aff_${event.id}=${activeRef}; path=/; max-age=2592000; SameSite=Lax`;
    }

    const serializedItems = selectedItems.map((item) => `${item.categoryId}:${item.qty}`).join(',');
    const checkoutUrl = `/checkout?eventId=${event.id}&items=${serializedItems}`;

    if (event.requireLogin && !user) {
      toast.info('Event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu.');
      router.push(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    router.push(checkoutUrl);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <Skeleton className="h-8 w-1/4 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-80 w-full bg-slate-100 rounded-2xl" />
            <Skeleton className="h-40 w-full bg-slate-100 rounded-2xl" />
            <Skeleton className="h-48 w-full bg-slate-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-80 w-full bg-slate-100 rounded-2xl" />
            <Skeleton className="h-40 w-full bg-slate-100 rounded-2xl" />
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
        <p className="text-slate-500 text-xs sm:text-sm">
          Event yang Anda cari tidak ada atau belum dipublikasikan oleh pihak penyelenggara.
        </p>
        <Button
          onClick={() => router.push('/')}
          className="bg-[#08ADAE] hover:bg-[#07999A] text-white rounded-xl cursor-pointer text-xs font-bold"
        >
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

  const totalSelectedQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  const minPrice =
    event.ticketCategories.length > 0
      ? Math.min(...event.ticketCategories.map((c) => c.price))
      : 0;

  const totalRemainingQuota = event.ticketCategories.reduce(
    (sum, c) => sum + Math.max(0, c.quota - c.sold),
    0
  );

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Navigation & Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-slate-600 hover:text-[#08ADAE] hover:bg-slate-50 rounded-xl -ml-2 gap-2 cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleShareWhatsApp}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Bagikan</span> WhatsApp
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: DETAIL EVENT, BANNER, RUNDOWN, FASILITAS, ATURAN              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Banner with Rich Fallback Texture */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
            {event.bannerUrl ? (
              <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.bannerUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              /* Rich Aesthetic Event Passport Fallback (Never Empty) */
              <div className="relative min-h-[260px] sm:min-h-[340px] w-full p-6 sm:p-10 flex flex-col justify-between overflow-hidden bg-slate-900 text-white">
                {/* Subtle Geometric Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#08ADAE_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#08ADAE]/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-[#08ADAE] border border-white/15 backdrop-blur-md flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#08ADAE]" />
                    <span>EVENT RESMI TAQTIX</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    {event.organizer.name}
                  </span>
                </div>

                {/* Event Heading in Banner */}
                <div className="relative z-10 my-4 space-y-3 max-w-2xl">
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 font-medium pt-1">
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
                      <Calendar className="w-3.5 h-3.5 text-[#08ADAE]" />
                      <span>{formattedDateRange}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
                      <MapPin className="w-3.5 h-3.5 text-[#08ADAE]" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Assurance */}
                <div className="relative z-10 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sistem Tiket Kriptografi Terverifikasi</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    TAQTIX SECURE TICKETING
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Pendaftaran Dibuka</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Users className="w-3 h-3 text-[#08ADAE]" />
                  <span>Sisa {totalRemainingQuota.toLocaleString('id-ID')} Kuota</span>
                </span>
                {minPrice > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    <Ticket className="w-3 h-3 text-[#08ADAE]" />
                    <span>Mulai {minPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {event.title}
              </h1>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
                <span>Diselenggarakan oleh:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  {event.organizer.name}
                  <BadgeCheck className="w-3.5 h-3.5 text-[#08ADAE]" />
                </span>
              </div>
            </div>

            {/* Date, Time & Venue Key Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Tanggal & Waktu Acara</h4>
                  <p className="text-slate-800 font-semibold mt-0.5">{formattedDateRange}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Waktu Indonesia Barat (WIB)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Lokasi Penyelenggaraan</h4>
                  <p className="text-slate-800 font-semibold mt-0.5">{event.location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#08ADAE] font-semibold hover:underline mt-0.5"
                  >
                    <span>Petunjuk Arah Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#08ADAE]" />
                <span>Deskripsi Lengkap Acara</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description ||
                  'Acara ini diselenggarakan secara profesional dengan fasilitas lengkap dan pengalaman berharga bagi setiap peserta yang hadir.'}
              </p>
            </div>

            {/* Double Engagement Search & Category Tags */}
            {(event.seoKeywords || event.adminSeoKeywords) && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#08ADAE]" />
                  <span>Kategori & Topik Terkait</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.seoKeywords &&
                    event.seoKeywords.split(',').map((kw: string, i: number) => {
                      const trimmed = kw.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={`eo-${i}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium hover:bg-slate-200 transition"
                        >
                          #{trimmed}
                        </span>
                      );
                    })}
                  {event.adminSeoKeywords &&
                    event.adminSeoKeywords.split(',').map((kw: string, i: number) => {
                      const trimmed = kw.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={`admin-${i}`}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-[#08ADAE]" />
                          <span>#{trimmed}</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* BINTANG TAMU & PENGISI ACARA (LINE UP) */}
          {event.lineup && event.lineup.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                    Guest Stars & Performers
                  </span>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-[#08ADAE]" />
                    <span>Line Up Bintang Tamu & Pengisi Acara</span>
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {event.lineup.length} Pengisi Acara
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                {event.lineup.map((artist) => (
                  <div
                    key={artist.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#08ADAE]/50 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-center gap-3.5">
                      {artist.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={artist.photoUrl}
                          alt={artist.name}
                          className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] font-black text-lg shrink-0">
                          {artist.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#08ADAE] transition-colors">
                          {artist.name}
                        </h4>
                        <div className="space-y-0.5 mt-0.5">
                          {artist.performTime && (
                            <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-600">
                              <Clock className="w-3 h-3 text-[#08ADAE]" />
                              {artist.performTime}
                            </span>
                          )}
                          {artist.stage && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {artist.stage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {artist.socialUrl && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <a
                          href={artist.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#08ADAE] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Profil / Sosmed</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FASILITAS & MANFAAT PESERTA (BENEFITS & FACILITIES) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                Keuntungan & Fasilitas
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Fasilitas yang Anda Dapatkan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#08ADAE]" />
                  <span>Akses Gate Cepat & Praktis</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Pemindaian tiket berlangsung kurang dari 0.3 detik per orang dengan aplikasi scanner resmi petugas di pintu masuk venue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-[#08ADAE]" />
                  <span>E-Ticket Resmi via WhatsApp</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Tidak perlu mencetak tiket fisik. QR Code resmi dikirim langsung ke nomor WhatsApp dan tersimpan aman di akun Anda.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#08ADAE]" />
                  <span>Garansi Anti-Double Booking</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Sistem concurrency locking menjamin kuota tiket yang Anda pilih terkunci saat pembayaran, aman dari perebutan pihak lain.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <CreditCard className="w-4 h-4 text-[#08ADAE]" />
                  <span>Bukti Pembayaran & Faktur Sah</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Invoice dan bukti transaksi terbit secara otomatis lengkap dengan kode referensi pembayaran untuk keamanan maksimal.
                </p>
              </div>
            </div>
          </div>

          {/* RUNDOWN & JADWAL ACARA (TIMELINE) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                  Rangkaian Agenda
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#08ADAE]" />
                  <span>Estimasi Rundown Acara</span>
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Jadwal Tentatif
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 shrink-0">
                  08:00 - 09:00
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Open Gate & Registrasi Kehadiran</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Pemeriksaan barang bawaan dan pemindaian barcode e-ticket di pintu masuk venue oleh panitia.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 shrink-0">
                  09:00 - 09:30
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Pembukaan & Sambutan Resmi</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Pengondisian ruangan dan sambutan resmi dari pihak panitia penyelenggara acara.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#08ADAE]/5 border border-[#08ADAE]/20">
                <div className="px-2.5 py-1 rounded-xl bg-[#08ADAE] text-white font-mono text-xs font-bold shrink-0">
                  09:30 - 11:30
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Sesi Utama Acara & Pemaparan</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Rangkaian agenda utama, pemaparan materi inti, dan penampilan pembicara/pengisi acara.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 shrink-0">
                  11:30 - 12:00
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Tanya Jawab, Doa & Penutup</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Sesi interaktif tanya jawab, ramah tamah antar peserta, dan doa penutup rangkaian acara.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SYARAT, KETENTUAN & PANDUAN MASUK */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                Tata Tertib Venue
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-[#08ADAE]" />
                <span>Syarat & Ketentuan Menghadiri Acara</span>
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed pt-1">
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Pengunjung wajib menunjukkan <strong>QR Code E-Ticket</strong> resmi TAQtix dari pesan WhatsApp atau menu Tiket Saya di pintu masuk gerbang.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Pengunjung disarankan membawa kartu identitas fisik resmi (KTP, SIM, atau Kartu Pelajar) yang sesuai dengan nama pada e-ticket untuk verifikasi jika diperlukan.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Tiket yang sudah dibeli tidak dapat dibatalkan atau direfund, kecuali Jika terjadi pembatalan acara oleh penyelenggara, maka refund sepenuhnya ditanggung oleh pihak penyelenggara.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  4
                </span>
                <p>
                  Dilarang membawa senjata tajam, obat-obatan terlarang, flare, botol kaca, atau benda yang membahayakan kenyamanan dan keselamatan pengunjung lain.
                </p>
              </div>
            </div>
          </div>

          {/* LOKASI VENUE & PETUNJUK MAPS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                  Peta Lokasi
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#08ADAE]" />
                  <span>Lokasi Venue Acara</span>
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#08ADAE] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{event.location}</h4>
                  <p className="text-[11px] text-slate-500">
                    Pastikan tiba di lokasi minimal 30-60 menit sebelum sesi acara dimulai.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#08ADAE] text-white text-xs font-bold hover:bg-[#07999A] transition shadow-xs cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Buka di Google Maps</span>
                </a>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(event.location);
                    toast.success('Alamat lokasi berhasil disalin!');
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Alamat</span>
                </Button>
              </div>
            </div>
          </div>

          {/* PROFIL PENYELENGGARA ACARA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                Tentang Penyelenggara
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#08ADAE]" />
                <span>Pihak Penyelenggara Resmi</span>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  {event.organizer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {event.organizer.name}
                    <BadgeCheck className="w-4 h-4 text-[#08ADAE]" />
                  </h4>
                  <p className="text-xs text-slate-500">Penyelenggara Terverifikasi di TAQtix</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/628158006658?text=${encodeURIComponent(`Halo panitia ${event.organizer.name}, saya ingin bertanya tentang acara "${event.title}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tanya Panitia</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: STICKY TICKET SELECTION & CHECKOUT SIDEBAR                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[#08ADAE]" />
                  <span>Pilih Kategori Tiket</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {event.ticketCategories.length} Kategori
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
              {event.requireLogin && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">Wajib Masuk Akun</span>
                    <span className="text-[11px] text-amber-800 leading-tight">
                      Pemesanan tiket event ini mewajibkan Anda untuk masuk (login) akun TAQtix terlebih dahulu.
                    </span>
                  </div>
                </div>
              )}

              {event.ticketCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Kategori tiket belum tersedia.</p>
              ) : (
                <div className="space-y-3">
                  {event.ticketCategories.map((category) => {
                    const selected = quantities[category.id] || 0;
                    const remaining = Math.max(0, category.quota - category.sold);
                    const isSoldOut = remaining <= 0;

                    return (
                      <div
                        key={category.id}
                        className={`flex flex-col justify-between p-4 border rounded-2xl space-y-3 transition-colors ${
                          selected > 0
                            ? 'border-[#08ADAE] bg-[#08ADAE]/5'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{category.name}</h4>
                            <span className="text-[#08ADAE] text-xs sm:text-sm font-black block">
                              {category.price.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          {isSoldOut ? (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Habis Terjual
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Sisa {remaining}
                            </span>
                          )}
                        </div>

                        {!isSoldOut && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Maks. {category.maxPerOrder} tiket
                            </span>
                            <div className="flex items-center space-x-2.5">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(category.id, -1, category.maxPerOrder)}
                                disabled={selected === 0}
                                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                                aria-label="Kurangi tiket"
                              >
                                <Minus className="h-3.5 w-3.5 text-slate-600" />
                              </button>
                              <span className="w-5 text-center font-bold text-xs sm:text-sm text-slate-900 font-mono">
                                {selected}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQtyChange(category.id, 1, Math.min(remaining, category.maxPerOrder))
                                }
                                disabled={selected >= Math.min(remaining, category.maxPerOrder)}
                                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                                aria-label="Tambah tiket"
                              >
                                <Plus className="h-3.5 w-3.5 text-slate-600" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ALWAYS-VISIBLE SUMMARY & CHECKOUT CALL-TO-ACTION */}
              <div className="border-t border-slate-200/80 pt-4 space-y-4">
                {totalSelectedQty > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5 text-xs">
                      {selectedItems.map((item) => {
                        const cat = event.ticketCategories.find((c) => c.id === item.categoryId);
                        if (!cat) return null;
                        return (
                          <div key={item.categoryId} className="flex justify-between text-slate-600">
                            <span>
                              {item.qty}x {cat.name}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {(cat.price * item.qty).toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Total Pembayaran</span>
                        <span className="text-lg font-black text-slate-900">
                          {totalCost.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#08ADAE] bg-[#08ADAE]/10 px-2.5 py-1 rounded-full">
                        {totalSelectedQty} Tiket
                      </span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-[#08ADAE] hover:bg-[#07999A] text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-[0.98] border-0 text-xs flex items-center justify-center gap-2"
                    >
                      <span>Lanjutkan ke Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Pembayaran</span>
                      <span className="font-bold text-slate-400">Rp 0</span>
                    </div>
                    <Button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 px-4 rounded-xl text-xs cursor-not-allowed border-0"
                    >
                      Pilih Minimal 1 Tiket
                    </Button>
                    <p className="text-[11px] text-slate-400 text-center leading-normal">
                      Tekan tombol <strong>(+)</strong> pada kategori di atas untuk menentukan jumlah tiket.
                    </p>
                  </div>
                )}
              </div>

              {/* JAMINAN TRANSAKSI AMAN */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5 text-xs">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Jaminan Transaksi TAQtix
                </span>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Tiket Resmi & Terverifikasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>E-Ticket Langsung Masuk WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kuota Terkunci saat Checkout</span>
                  </div>
                </div>
              </div>

              {/* METODE PEMBAYARAN RESMI */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                  Metode Pembayaran
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mendukung QRIS instan (BCA, Livin, GoPay, OVO, ShopeePay, Dana) & Virtual Account seluruh bank utama.
                </p>
              </div>

              {/* BANTUAN PELANGGAN */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Butuh bantuan pemesanan?</span>
                <a
                  href="https://wa.me/628158006658"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#08ADAE] hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>CS WhatsApp</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
