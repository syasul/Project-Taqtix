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
  Music,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

const InstagramIcon = ({ className = 'w-3.5 h-3.5 shrink-0' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-3.5 h-3.5 shrink-0' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TikTokIcon = ({ className = 'w-3.5 h-3.5 shrink-0' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55v-3.5a4.84 4.84 0 0 1-1.07-.11Z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const curatedLineupsBySlug: Record<string, LineUpItem[]> = {
  'kajian-akbar-digital-hidayah': [
    {
      id: 'kajian-1',
      name: 'Ustadz Dr. Firanda Andirja, Lc., M.A.',
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      performTime: '08:30 - 10:00 WIB',
      stage: 'Panggung Utama (Masjid Istiqlal)',
      socialUrl: 'https://instagram.com/firanda_andirja_official',
    },
    {
      id: 'kajian-2',
      name: 'Ustadz Muhammad Nuzul Dzikri, Lc.',
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      performTime: '10:15 - 11:30 WIB',
      stage: 'Panggung Utama (Masjid Istiqlal)',
      socialUrl: 'https://instagram.com/muhammadnuzuldzikri',
    },
    {
      id: 'kajian-3',
      name: 'Ustadz Adi Hidayat, Lc., M.A.',
      photoUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      performTime: '11:30 - 12:30 WIB',
      stage: 'Panggung Utama (Masjid Istiqlal)',
      socialUrl: 'https://instagram.com/adihidayatofficial',
    },
  ],
  'fest-hijrah-halal-culinary-2026': [
    {
      id: 'fest-1',
      name: 'Ustadz Felix Siauw',
      photoUrl:
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop',
      performTime: '13:00 - 15:00 WIB',
      stage: 'Main Hall ICE BSD',
      socialUrl: 'https://instagram.com/felixsiauw',
    },
    {
      id: 'fest-2',
      name: 'Taqy Malik',
      photoUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
      performTime: '15:30 - 17:00 WIB',
      stage: 'Culinary Expo Stage',
      socialUrl: 'https://instagram.com/taqy_malik',
    },
    {
      id: 'fest-3',
      name: 'Opick Tombo Ati',
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 21:00 WIB',
      stage: 'Charity Concert Stage',
      socialUrl: 'https://instagram.com/opick_tomboati',
    },
  ],
  'simfoni-sholawat-nusantara': [
    {
      id: 'sholawat-1',
      name: 'Habib Syech bin Abdul Qodir Assegaf',
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 21:00 WIB',
      stage: 'Teater Besar Grand Stage',
      socialUrl: 'https://instagram.com/syaikhassegaf',
    },
    {
      id: 'sholawat-2',
      name: 'Veve Zulfikar Basyaiban',
      photoUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
      performTime: '21:00 - 21:45 WIB',
      stage: 'Teater Besar Grand Stage',
      socialUrl: 'https://instagram.com/veve_zulfikar',
    },
    {
      id: 'sholawat-3',
      name: 'Ahbaabul Musthofa Ensemble',
      photoUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
      performTime: '19:30 - 22:30 WIB',
      stage: 'Pit Orchestra TIM',
      socialUrl: 'https://instagram.com/ahbaabulmusthofa_official',
    },
  ],
};

function getEventLineup(event: { slug?: string; title?: string; lineup?: LineUpItem[] }): LineUpItem[] {
  if (event.lineup && event.lineup.length > 0) {
    return event.lineup;
  }
  const slug = (event.slug || '').toLowerCase();
  const title = (event.title || '').toLowerCase();

  if (curatedLineupsBySlug[slug]) {
    return curatedLineupsBySlug[slug];
  }

  if (slug.includes('kajian') || title.includes('kajian') || title.includes('hidayah')) {
    return curatedLineupsBySlug['kajian-akbar-digital-hidayah'];
  }
  if (slug.includes('sholawat') || title.includes('sholawat') || title.includes('simfoni')) {
    return curatedLineupsBySlug['simfoni-sholawat-nusantara'];
  }
  if (slug.includes('fest') || slug.includes('culinary') || title.includes('fest')) {
    return curatedLineupsBySlug['fest-hijrah-halal-culinary-2026'];
  }

  return [
    {
      id: 'default-lineup-1',
      name: 'Pembicara & Pengisi Acara Utama',
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      performTime: 'Sesuai Rundown Acara',
      stage: 'Panggung Utama',
      socialUrl: 'https://instagram.com/taqtix.id',
    },
  ];
}

function getSanitizedPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.includes('photo-1544717305-2782549b5136')) {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop';
  }
  return photoUrl;
}

function parseSocialLink(url?: string | null, fallbackName?: string) {
  if (!url) {
    const handle = fallbackName
      ? fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15)
      : 'taqtix.id';
    return {
      type: 'instagram' as const,
      label: `@${handle}`,
      href: `https://instagram.com/${handle}`,
    };
  }
  const clean = url.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('instagram.com') || clean.startsWith('@')) {
    let handle = clean;
    if (lower.includes('instagram.com/')) {
      handle = clean.split(/instagram\.com\//i)[1]?.split(/[/?#]/)[0] || 'Instagram';
    }
    handle = handle.replace(/^@/, '');
    return {
      type: 'instagram' as const,
      label: `@${handle}`,
      href: clean.startsWith('http') ? clean : `https://instagram.com/${handle}`,
    };
  }

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      type: 'youtube' as const,
      label: 'YouTube Channel',
      href: clean.startsWith('http') ? clean : `https://${clean}`,
    };
  }

  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    let handle = 'X (Twitter)';
    if (lower.includes('twitter.com/')) {
      handle = `@${clean.split(/twitter\.com\//i)[1]?.split(/[/?#]/)[0] || 'Twitter'}`;
    } else if (lower.includes('x.com/')) {
      handle = `@${clean.split(/x\.com\//i)[1]?.split(/[/?#]/)[0] || 'X'}`;
    }
    return {
      type: 'twitter' as const,
      label: handle,
      href: clean.startsWith('http') ? clean : `https://${clean}`,
    };
  }

  if (lower.includes('tiktok.com')) {
    return {
      type: 'tiktok' as const,
      label: 'TikTok Profile',
      href: clean.startsWith('http') ? clean : `https://${clean}`,
    };
  }

  return {
    type: 'website' as const,
    label: 'Profil / Sosmed',
    href: clean.startsWith('http') ? clean : `https://${clean}`,
  };
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
  isDateTba?: boolean;
  requireLogin?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  adminSeoKeywords?: string;
  seoPriority?: string;
  organizer: {
    name: string;
    slug?: string;
    logoUrl?: string;
    phone?: string;
    website?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
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

  const formattedDateRange = event.isDateTba
    ? 'Tanggal & Waktu Segera Diumumkan (TBA)'
    : `${format(new Date(event.startDate), 'd MMMM yyyy', {
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

  const primaryCategory = (() => {
    if (event.seoKeywords) {
      const first = event.seoKeywords.split(',')[0].trim();
      if (first) return first;
    }
    const text = (event.title + ' ' + (event.description || '')).toLowerCase();
    if (text.includes('musik') || text.includes('konser') || text.includes('festival') || text.includes('show') || text.includes('vol.')) return 'Musik';
    if (text.includes('kajian') || text.includes('tabligh') || text.includes('hijrah')) return 'Kajian';
    if (text.includes('workshop') || text.includes('seminar') || text.includes('kelas')) return 'Workshop';
    if (text.includes('sport') || text.includes('lari') || text.includes('sepeda')) return 'Olahraga';
    return 'Musik';
  })();

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
            className="rounded-xl text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Bagikan</span> WhatsApp
          </Button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ayo hadiri ${event.title}! Dapatkan tiket resminya di TAQtix:`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition active:scale-95"
          >
            <TwitterIcon />
            <span>Bagikan X</span>
          </a>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95"
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
                  src={event.bannerUrl || '/default-banner.svg'}
                  alt={event.title}
                  onError={(e) => {
                    if (e.currentTarget.src !== '/default-banner.svg' && !e.currentTarget.src.endsWith('/default-banner.svg')) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/default-banner.svg';
                    }
                  }}
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
            <div className="space-y-4">
              {/* Category & Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
                  <Music className="w-3.5 h-3.5 text-blue-600" />
                  <span>{primaryCategory}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Pendaftaran Dibuka</span>
                </span>
                {event.isDateTba && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Jadwal TBA</span>
                  </span>
                )}
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

              {/* Event Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                {event.title}
              </h1>

              {/* Penyelenggara & Media Sosial Section (Matches Mockup) */}
              <div className="pt-2 space-y-4 border-t border-slate-100">
                {/* Penyelenggara */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 block">Penyelenggara</span>
                  <div className="flex items-center gap-2.5">
                    {event.organizer.logoUrl ? (
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.organizer.logoUrl}
                          alt={event.organizer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {event.organizer.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {event.organizer.name}
                    </span>
                  </div>
                </div>

                {/* Media Sosial */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 block">Media Sosial</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Instagram */}
                    <a
                      href={
                        event.organizer.instagram
                          ? (event.organizer.instagram.startsWith('http')
                              ? event.organizer.instagram
                              : `https://instagram.com/${event.organizer.instagram.replace(/^@/, '')}`)
                          : `https://instagram.com/${(event.organizer.slug || event.organizer.name || 'taqtix').toLowerCase().replace(/[^a-z0-9._]/g, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-600 text-xs font-semibold transition active:scale-95 shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <InstagramIcon className="w-2.5 h-2.5" />
                      </span>
                      <span>Instagram</span>
                    </a>

                    {/* TikTok */}
                    {(event.organizer.tiktok || event.organizer.slug) && (
                      <a
                        href={
                          event.organizer.tiktok
                            ? (event.organizer.tiktok.startsWith('http')
                                ? event.organizer.tiktok
                                : `https://tiktok.com/@${event.organizer.tiktok.replace(/^@/, '')}`)
                            : `https://tiktok.com/@${(event.organizer.slug || event.organizer.name || 'taqtix').toLowerCase().replace(/[^a-z0-9._]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-600 text-xs font-semibold transition active:scale-95 shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                          <TikTokIcon className="w-2.5 h-2.5 fill-white" />
                        </span>
                        <span>TikTok</span>
                      </a>
                    )}

                    {/* YouTube */}
                    {event.organizer.youtube && (
                      <a
                        href={
                          event.organizer.youtube.startsWith('http')
                            ? event.organizer.youtube
                            : `https://youtube.com/${event.organizer.youtube.startsWith('@') ? event.organizer.youtube : '@' + event.organizer.youtube}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 text-xs font-semibold transition active:scale-95 shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                          <YoutubeIcon className="w-2.5 h-2.5 fill-white" />
                        </span>
                        <span>YouTube</span>
                      </a>
                    )}

                    {/* Website */}
                    {event.organizer.website && (
                      <a
                        href={
                          event.organizer.website.startsWith('http')
                            ? event.organizer.website
                            : `https://${event.organizer.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 text-[10px]">
                          <Globe className="w-2.5 h-2.5 text-white" />
                        </span>
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Date, Time & Venue Key Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start space-x-3.5">
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border',
                    event.isDateTba
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      : 'bg-[#08ADAE]/10 border-[#08ADAE]/20 text-[#08ADAE]'
                  )}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Tanggal & Waktu Acara</h4>
                  <p className={cn('mt-0.5', event.isDateTba ? 'text-amber-600 font-bold' : 'text-slate-800 font-semibold')}>
                    {formattedDateRange}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {event.isDateTba ? 'Akan diumumkan lebih lanjut oleh penyelenggara' : 'Waktu Indonesia Barat (WIB)'}
                  </p>
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
          {(() => {
            const displayLineup = getEventLineup(event);
            if (!displayLineup || displayLineup.length === 0) return null;
            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#08ADAE] uppercase tracking-wider">
                      Guest Stars, Asatidz & Performers
                    </span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      <Mic2 className="w-5 h-5 text-[#08ADAE]" />
                      <span>Line Up Bintang Tamu & Pengisi Acara</span>
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {displayLineup.length} Pengisi Acara
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {displayLineup.map((artist) => {
                    const social = parseSocialLink(artist.socialUrl, artist.name);
                    const photoUrl = getSanitizedPhotoUrl(artist.photoUrl);

                    return (
                      <div
                        key={artist.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-150 group"
                      >
                        {/* Left: Avatar + Details */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoUrl}
                                alt={artist.name}
                                className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-[#08ADAE]/10 border border-[#08ADAE]/25 flex items-center justify-center text-[#08ADAE] font-black text-xl shadow-xs">
                                {artist.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Info: Role Tag, Full Name, Time & Stage */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#08ADAE]/10 text-[#08ADAE] border border-[#08ADAE]/20">
                                Pemateri
                              </span>
                            </div>

                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {artist.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                              {artist.performTime && (
                                <span className="inline-flex items-center gap-1.5 font-mono font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                                  <Clock className="w-3.5 h-3.5 text-[#08ADAE] shrink-0" />
                                  <span>{artist.performTime}</span>
                                </span>
                              )}
                              {artist.stage && (
                                <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{artist.stage}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Social Media Action Button */}
                        <div className="shrink-0 flex sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <a
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 ${
                              social.type === 'instagram'
                                ? 'bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300'
                                : social.type === 'youtube'
                                ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                                : social.type === 'twitter'
                                ? 'bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200'
                                : 'bg-[#08ADAE]/10 border border-[#08ADAE]/25 text-[#08ADAE] hover:bg-[#08ADAE]/20'
                            }`}
                          >
                            {social.type === 'instagram' && <InstagramIcon />}
                            {social.type === 'youtube' && <YoutubeIcon />}
                            {social.type === 'twitter' && <TwitterIcon />}
                            {social.type !== 'instagram' &&
                              social.type !== 'youtube' &&
                              social.type !== 'twitter' && <Globe className="w-3.5 h-3.5" />}
                            <span>{social.label}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 space-y-0">
              {/* INTERACTIVE EMBEDDED GOOGLE MAP */}
              <div className="w-full h-64 sm:h-80 bg-slate-100 relative overflow-hidden">
                <iframe
                  title="Peta Lokasi Acara"
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    event.location
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              {/* Venue details and actions below map */}
              <div className="p-4 sm:p-5 space-y-3 bg-white">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{event.location}</h4>
                    <p className="text-[11px] text-slate-500">
                      Pastikan tiba di lokasi minimal 30-60 menit sebelum sesi acara dimulai.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#08ADAE] text-white text-xs font-bold hover:bg-[#07999A] transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Buka Rute di Google Maps</span>
                  </a>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(event.location);
                      toast.success('Alamat lokasi berhasil disalin ke papan klip!');
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Alamat</span>
                  </Button>
                </div>
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
                {event.organizer.logoUrl ? (
                  <div className="h-12 w-12 rounded-2xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-xs">
                    <img
                      src={event.organizer.logoUrl}
                      alt={event.organizer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {event.organizer.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {event.organizer.name}
                    <BadgeCheck className="w-4 h-4 text-[#08ADAE]" />
                  </h4>
                  <p className="text-xs text-slate-500">Penyelenggara Terverifikasi di TAQtix</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Instagram */}
                {(event.organizer.instagram || (!event.organizer.tiktok && !event.organizer.youtube && !event.organizer.website)) && (
                  <a
                    href={
                      event.organizer.instagram
                        ? (event.organizer.instagram.startsWith('http')
                            ? event.organizer.instagram
                            : `https://instagram.com/${event.organizer.instagram.replace(/^@/, '')}`)
                        : `https://instagram.com/${(event.organizer.slug || event.organizer.name || 'taqwamedia').toLowerCase().replace(/[^a-z0-9]/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200/80 text-pink-700 text-xs font-bold hover:bg-pink-100 transition shadow-2xs active:scale-95"
                  >
                    <InstagramIcon />
                    <span>Instagram</span>
                  </a>
                )}

                {/* TikTok */}
                {event.organizer.tiktok && (
                  <a
                    href={
                      event.organizer.tiktok.startsWith('http')
                        ? event.organizer.tiktok
                        : `https://tiktok.com/@${event.organizer.tiktok.replace(/^@/, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-200 transition shadow-2xs active:scale-95"
                  >
                    <TikTokIcon />
                    <span>TikTok</span>
                  </a>
                )}

                {/* YouTube */}
                {event.organizer.youtube && (
                  <a
                    href={
                      event.organizer.youtube.startsWith('http')
                        ? event.organizer.youtube
                        : `https://youtube.com/${event.organizer.youtube.startsWith('@') ? event.organizer.youtube : '@' + event.organizer.youtube}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition shadow-2xs active:scale-95"
                  >
                    <YoutubeIcon />
                    <span>YouTube</span>
                  </a>
                )}

                {/* Website */}
                {event.organizer.website && (
                  <a
                    href={
                      event.organizer.website.startsWith('http')
                        ? event.organizer.website
                        : `https://${event.organizer.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition shadow-2xs active:scale-95"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Website</span>
                  </a>
                )}

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${(event.organizer.phone ? event.organizer.phone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '628158006658')}?text=${encodeURIComponent(`Halo panitia ${event.organizer.name}, saya ingin bertanya tentang acara "${event.title}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs active:scale-95"
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
