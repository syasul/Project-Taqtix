'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle2,
  Plus,
  Minus,
  MessageSquare,
  QrCode,
  CreditCard,
  Lock,
  ArrowUpRight,
  Sparkles,
  Users,
  Smartphone,
  Star,
  Check,
  Clock,
  FileCheck,
  Layers,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from '@/components/event/event-card';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  isDateTba?: boolean;
  organizer: {
    name: string;
    slug?: string;
    avatarUrl?: string;
  };
  ticketCategories?: {
    price: number;
  }[];
}

// Kategori jumbotron
const categories = [
  'Semua Event',
  'Konser & Festival Musik',
  'Workshop, Seminar & Konferensi',
  'Sport',
  'Pertunjukan Seni & Budaya',
  'Event Komunitas & Gathering',
  'Event Religi & Sosial',
  'Pameran',
];

const cities = [
  'Semua Kota',
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Yogyakarta',
  'Bali',
  'Medan',
  'Semarang',
];

// Promotional Hero Banners
const heroBanners = [
  {
    id: 'bnr-1',
    title: 'Jakarta Live Fest 2026',
    subtitle: 'Simfoni Musik Akbar & Kolaborasi Musisi Terkemuka Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/event/jakarta-live-fest-2026',
    tag: 'EVENT PILIHAN',
    price: 'Mulai Rp 100.000',
    date: '12 September 2026',
    location: 'Jakarta Convention Center',
  },
  {
    id: 'bnr-2',
    title: 'Indonesia Creative & Culinary Expo 2026',
    subtitle: 'Eksibisi Lifestyle & Kuliner Terbesar Se-Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/event/indo-creative-culinary-expo-2026',
    tag: 'BAZAAR & CULINARY',
    price: 'Mulai Rp 35.000',
    date: '20-22 November 2026',
    location: 'ICE BSD, Tangerang',
  },
  {
    id: 'bnr-3',
    title: 'Jakarta Creative Workshop & Art Expo',
    subtitle: 'Eksplorasi Kaligrafi Modern, Fotografi & Desain Visual',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/event/jakarta-creative-workshop-2026',
    tag: 'ART & WORKSHOP',
    price: 'Mulai Rp 150.000',
    date: '5-6 Desember 2026',
    location: 'Senayan Park, Jakarta',
  },
];

// Partner & Organizer ticker items
const trustedPartners = [
  'Soundrenaline Waves',
  'Jakarta Music Fest',
  'Indo Culinary Expo',
  'Indo Creative Summit',
  'Borobudur Marathon',
  'Java Jazz Festival',
  'Nusantara Arts Fest',
  'Nusantara Coffee Week',
];

// 4-Step How It Works Guide
const howItWorksSteps = [
  {
    step: '01',
    title: 'Temukan Event Pilihan',
    desc: 'Jelajahi konser musik, festival, seminar, turnamen olahraga, dan seni. Filter berdasarkan kota atau kategori acara favorit Anda.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Pilih Kategori & Tiket',
    desc: 'Tersedia pilihan Early Bird, Presale hingga VIP. Kuota tiket diamankan secara otomatis saat Anda masuk ke proses checkout.',
    icon: Ticket,
  },
  {
    step: '03',
    title: 'Bayar Instan & Aman',
    desc: 'Selesaikan pembayaran menggunakan QRIS instan dari semua e-wallet dan m-banking, atau Virtual Account bank utama.',
    icon: CreditCard,
  },
  {
    step: '04',
    title: 'E-Ticket Masuk WhatsApp',
    desc: 'E-Ticket resmi ber-QR Code unik langsung terkirim ke WhatsApp Anda dan tersimpan di akun. Cukup tunjukkan saat gate check-in.',
    icon: Smartphone,
  },
];

// Security & Platform Reliability Pillars
const securityPillars = [
  {
    title: 'Kriptografi QR Code Anti-Pemalsuan',
    desc: 'Setiap e-ticket dibekali tanda tangan digital terenkripsi yang divalidasi langsung oleh sistem. Menjamin 100% keaslian dan mencegah tiket ganda.',
    icon: ShieldCheck,
    tag: 'Keamanan 100%',
  },
  {
    title: 'Virtual Waiting Room Anti-Crash',
    desc: 'Sistem antrean pintar berbasis cloud menjaga kestabilan sistem saat terjadi lonjakan traffic tiket war ribuan pengguna secara bersamaan.',
    icon: Zap,
    tag: 'High Concurrency',
  },
  {
    title: 'WhatsApp Dispatcher Real-Time',
    desc: 'Tiket dan invoice resmi dikirimkan langsung ke nomor WhatsApp pembeli dalam hitungan detik, bebas dari risiko tersasar ke folder spam email.',
    icon: MessageSquare,
    tag: 'Kirim Instan',
  },
  {
    title: 'Scanner Gate Kru Super Cepat',
    desc: 'Aplikasi scanner resmi kru pintu masuk mampu memvalidasi tiket dalam <0.3 detik per pengunjung, meminimalisir antrean panjang di venue.',
    icon: QrCode,
    tag: 'Check-in <0.3s',
  },
];

// Organizer Solutions
const organizerBenefits = [
  {
    title: 'Dashboard Penjualan Real-Time',
    desc: 'Pantau grafik penjualan tiket, omset, sisa kuota per kategori, dan data pembeli detik demi detik secara transparan.',
    icon: BarChart3,
  },
  {
    title: 'Manajemen Tiket Multi-Kategori',
    desc: 'Atur jadwal rilis Early Bird, Presale 1, Presale 2, VIP, custom field formulir pembeli, hingga batasan maksimal per pemesanan.',
    icon: Layers,
  },
  {
    title: 'Aplikasi Crew Scanner Siap Pakai',
    desc: 'Kru lapangan cukup login dengan akun scanner untuk memindai tiket penonton secara online maupun sinkronisasi offline.',
    icon: QrCode,
  },
  {
    title: 'Pencairan Dana Terjadwal & Pasti',
    desc: 'Laporan keuangan terintegrasi dengan pencairan dana penjualan tiket yang transparan, aman, dan tepat waktu ke rekening EO.',
    icon: CheckCircle2,
  },
];

// Event Day Checklist
const eventDayChecklist = [
  {
    title: 'Siapkan E-Ticket di WhatsApp atau Akun',
    desc: 'Pastikan pesan WhatsApp dari TAQtix atau menu Tiket Saya sudah siap di HP Anda. Disarankan menyimpan tangkapan layar (screenshot) sebagai cadangan jika sinyal venue padat.',
  },
  {
    title: 'Bawa Identitas Resmi (KTP / SIM / Paspor)',
    desc: 'Petugas keamanan gerbang dapat sewaktu-waktu meminta pencocokan identitas fisik dengan nama pemesan yang tertera pada e-ticket.',
  },
  {
    title: 'Tiba Lebih Awal saat Open Gate',
    desc: 'Gerbang venue umumnya dibuka 1-2 jam sebelum acara utama. Tiba lebih awal membantu Anda melewati pemeriksaan barang dan gate scan dengan santai.',
  },
  {
    title: 'Patuhi Aturan Keamanan Venue',
    desc: 'Hindari membawa senjata tajam, obat terlarang, flare, botol kaca, serta kamera profesional DSLR/Mirrorless tanpa izin media resmi dari pihak EO.',
  },
];

// User Testimonials
const userReviews = [
  {
    name: 'Dimas Arya Pratama',
    role: 'Penonton Konser • Jakarta',
    comment:
      'Pengalaman beli tiket war paling tenang! Masuk antrean waiting room teratur, begitu giliran tinggal scan QRIS langsung e-ticket masuk WhatsApp dalam 5 detik.',
    rating: 5,
    event: 'Jakarta Live Fest 2026',
  },
  {
    name: 'Sarah Amanda',
    role: 'Festival Goer • Bandung',
    comment:
      'Tampilan tiketnya rapi banget dan pas nyampe gate venue tinggal sodorin QR code di WhatsApp, kru langsung scan hitungan detik tanpa hambatan.',
    rating: 5,
    event: 'Wave Fest Sound Bandung',
  },
  {
    name: 'Rian Hidayat',
    role: 'Promotor & Event Organizer • Surabaya',
    comment:
      'Dashboard TAQtix bikin tim kami gampang banget pantau kuota dan sales. Crew scanner di gate juga stabil walaupun ribuan orang masuk bersamaan.',
    rating: 5,
    event: 'East Java Creative Expo',
  },
];

// FAQ items
const faqs = [
  {
    q: 'Bagaimana cara menerima tiket setelah pembayaran berhasil?',
    a: 'E-ticket resmi ber-QR Code unik akan langsung dikirimkan ke nomor WhatsApp Anda secara otomatis dalam hitungan detik. Tiket juga selalu tersimpan di akun Anda pada menu "Tiket Saya".',
  },
  {
    q: 'Apakah ada jaminan terhindar dari double-booking tiket?',
    a: 'Ya, 100%. TAQtix menerapkan sistem Concurrency Locking real-time. Begitu tiket dipilih dan masuk proses checkout, slot kursi langsung dikunci untuk Anda sehingga tidak bisa dibeli oleh pengguna lain.',
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Mendukung QRIS instan (GoPay, OVO, Dana, ShopeePay, BCA Mobile, dll.), Virtual Account seluruh bank utama (BCA, Mandiri, BNI, BRI, Permata), serta transfer bank dengan verifikasi otomatis tanpa perlu upload struk.',
  },
  {
    q: 'Bagaimana proses validasi tiket di lokasi acara (venue)?',
    a: 'Cukup tunjukkan barcode atau QR code langsung dari pesan WhatsApp Anda ke kru di pintu masuk. Scanner kru kami memproses validasi tiket dalam <0.3 detik tanpa hambatan antrean.',
  },
  {
    q: 'Bagaimana jika saya ingin menyelenggarakan acara sendiri di TAQtix?',
    a: 'Klik "Bikin Event (EO)" di menu atas atau bawah situs. Anda dapat mendaftar gratis, mengatur kategori tiket, membuat link afiliasi penjualan, serta mengunduh scanner kru resmi.',
  },
];

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('category');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'Semua Event');
  const [selectedCity, setSelectedCity] = useState('Semua Kota');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [recentOrder, setRecentOrder] = useState<{ orderId: string; timestamp: number } | null>(null);

  // Check recent order in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taqtix_recent_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 3 * 24 * 60 * 60 * 1000) {
          setRecentOrder(parsed);
        }
      }
    } catch {}
  }, []);

  // Sync category param from URL if changed
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Auto slide hero banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data;
    },
  });

  const events: Event[] = eventsResponse?.data || [];

  // Filter based on Search and Category
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'Semua Event' || selectedCategory === 'Semua') return true;
    if (selectedCategory === 'Konser & Festival Musik' || selectedCategory === 'Konser') {
      return (
        e.title.toLowerCase().includes('concert') ||
        e.title.toLowerCase().includes('konser') ||
        e.title.toLowerCase().includes('musik') ||
        e.title.toLowerCase().includes('music') ||
        e.title.toLowerCase().includes('festival') ||
        e.title.toLowerCase().includes('fest')
      );
    }
    if (selectedCategory === 'Workshop, Seminar & Konferensi' || selectedCategory === 'Workshop') {
      return (
        e.title.toLowerCase().includes('workshop') ||
        e.title.toLowerCase().includes('seminar') ||
        e.title.toLowerCase().includes('konferensi') ||
        e.title.toLowerCase().includes('kelas') ||
        e.title.toLowerCase().includes('pelatihan')
      );
    }
    if (selectedCategory === 'Sport') {
      return (
        e.title.toLowerCase().includes('sport') ||
        e.title.toLowerCase().includes('lari') ||
        e.title.toLowerCase().includes('marathon') ||
        e.title.toLowerCase().includes('olahraga')
      );
    }
    if (selectedCategory === 'Pertunjukan Seni & Budaya' || selectedCategory === 'Art & Culture') {
      return (
        e.title.toLowerCase().includes('art') ||
        e.title.toLowerCase().includes('culture') ||
        e.title.toLowerCase().includes('budaya') ||
        e.title.toLowerCase().includes('seni') ||
        e.title.toLowerCase().includes('teater') ||
        e.title.toLowerCase().includes('tari')
      );
    }
    if (selectedCategory === 'Event Komunitas & Gathering') {
      return (
        e.title.toLowerCase().includes('komunitas') ||
        e.title.toLowerCase().includes('gathering') ||
        e.title.toLowerCase().includes('meetup') ||
        e.title.toLowerCase().includes('community')
      );
    }
    if (selectedCategory === 'Event Religi & Sosial' || selectedCategory === 'Kajian') {
      return (
        e.title.toLowerCase().includes('religi') ||
        e.title.toLowerCase().includes('kajian') ||
        e.title.toLowerCase().includes('sosial') ||
        e.title.toLowerCase().includes('amal')
      );
    }
    if (selectedCategory === 'Pameran' || selectedCategory === 'Bazaar & Culinary') {
      return (
        e.title.toLowerCase().includes('pameran') ||
        e.title.toLowerCase().includes('expo') ||
        e.title.toLowerCase().includes('bazaar') ||
        e.title.toLowerCase().includes('culinary') ||
        e.title.toLowerCase().includes('exhibition')
      );
    }
    return true;
  });

  // Events filtered by City for the Slider
  const cityEvents = events.filter((e) => {
    if (selectedCity === 'Semua Kota') return true;
    return e.location.toLowerCase().includes(selectedCity.toLowerCase());
  });

  const currentBanner = heroBanners[activeBannerIdx];

  return (
    <div className="space-y-20 pb-28">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (ASTRO OBSIDIAN COSMIC HERO & DOCK)                       */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative pt-4 sm:pt-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          {recentOrder && (
            <Link
              href="/tickets"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#08ADAE]/15 border border-[#08ADAE]/40 text-[#00F0FF] hover:bg-[#08ADAE]/25 transition flex items-center gap-2 shadow-[0_0_20px_rgba(8,173,174,0.25)] group"
            >
              <Ticket className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Kamu memiliki transaksi tiket di perangkat ini</span>
              <span className="underline group-hover:translate-x-0.5 transition-transform flex items-center">
                Lihat Semua Tiket
                <ArrowRight className="w-3 h-3 ml-0.5 inline" />
              </span>
            </Link>
          )}

          {/* Astro Glass Status Badge */}
          <div className="astro-glass-pill px-4 py-1.5 rounded-full inline-flex items-center gap-2.5 text-xs font-semibold text-slate-300 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse ring-4 ring-[#08ADAE]/30" />
            <span>Platform Tiket Resmi Berbasis Cloud & WhatsApp</span>
          </div>

          {/* Main Headline (Astro Neon Gradient) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.12]">
            Temukan Acara Favorit.{' '}
            <span className="astro-neon-text">Beli Tiket Resmi</span> Tanpa Ribet.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Cari konser musik, festival, workshop, turnamen olahraga, dan pertunjukan seni terbaik. Terverifikasi 100% resmi langsung dari penyelenggara terpercaya.
          </p>

          {/* Astro Floating Glass Unified Search Dock */}
          <div className="w-full max-w-3xl mt-4 p-2.5 astro-glass-pill rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 transition-all hover:border-[#08ADAE]/45 border border-white/15">
            <div className="flex items-center gap-3 px-4 py-2 w-full sm:w-auto flex-1">
              <Search className="h-4 w-4 text-[#00F0FF] shrink-0" />
              <input
                type="text"
                placeholder="Cari konser, festival, workshop, olahraga, seni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm text-white placeholder:text-slate-500 focus:outline-none bg-transparent"
              />
            </div>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2 px-3 py-2 w-full sm:w-44 border-t sm:border-t-0 border-white/10">
              <MapPin className="h-4 w-4 text-[#08ADAE] shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs font-semibold text-slate-300 bg-transparent focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('discovery-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_0_24px_rgba(8,173,174,0.45)] active:scale-95"
            >
              <span>Cari Event</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Category Pills with Astro Bento Feel */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AUTHENTIC ASTRO BENTO TICKET & CAPABILITIES PANEL */}
        <div className="mt-14 max-w-5xl mx-auto rounded-3xl astro-glass p-6 sm:p-9 shadow-2xl relative overflow-hidden border border-white/10">
          {/* Subtle Top Specular Gradient Line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Authentic Dark Obsidian Glass Ticket Pass */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5.5 relative overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
                    <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                      Tiket Terkonfirmasi
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#00F0FF] bg-[#00F0FF]/10 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/30">
                    VIP ACCESS
                  </span>
                </div>

                {/* Event Details */}
                <div className="py-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TAQtix Official Partner
                  </span>
                  <h4 className="text-base font-bold text-white leading-snug">
                    Nusantara Live Music Festival 2026
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#00F0FF]" />
                      12 Sep 2026
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
                      JCC Senayan
                    </span>
                  </div>
                </div>

                {/* Perforation Line with Side Notches (Blended with Cosmic Background) */}
                <div className="relative my-2">
                  <div className="border-t border-dashed border-white/20" />
                  <div className="absolute -left-8 -top-2.5 h-5 w-5 rounded-full bg-[#060913] border-r border-white/15" />
                  <div className="absolute -right-8 -top-2.5 h-5 w-5 rounded-full bg-[#060913] border-l border-white/15" />
                </div>

                {/* Barcode / QR Section */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-xs">
                      <QrCode className="w-11 h-11 text-slate-950" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-mono font-bold text-white">
                        TQTX-2026-X8921
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Scan di Gate 3A (Kru Scanner)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Bayar</span>
                    <span className="text-xs font-black text-[#F0B829] font-mono">Rp 250.000</span>
                  </div>
                </div>

                {/* WhatsApp badge footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Terkirim ke WhatsApp
                  </span>
                  <span className="font-mono text-[10px] text-[#00F0FF]">STATUS: PAID</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Capabilities (Astro Bento Tiles) */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00F0FF] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Infrastruktur Ticketing Andal
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  Pengalaman Transaksi Bebas Masalah
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  TAQtix dirancang untuk memastikan setiap detik proses pembelian hingga gate check-in berjalan lancar, terenkripsi, dan aman.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl astro-card border border-white/10 hover:border-[#08ADAE]/50">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Tiket Resmi, Lebih Tenang
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                      Beli tiket melalui kanal resmi event yang terverifikasi langsung di TAQtix.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl astro-card border border-white/10 hover:border-[#08ADAE]/50">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Tiket Digital, Praktis Diakses
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                      Temukan tiket dan informasi akses seketika setelah pembayaran terverifikasi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl astro-card border border-white/10 hover:border-[#08ADAE]/50">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Check-in Kurang dari 0.3 Detik
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                      Scanner kru resmi gate check-in bekerja instan via kamera HP tanpa antrean panjang.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ORGANIZER & PARTNER ASTRO GLASS STRIP */}
        <div className="mt-12 py-5 px-6 rounded-2xl astro-glass border border-white/10 shadow-xl">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
            Dipercaya oleh Penyelenggara Event & Festival Terkemuka
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs sm:text-sm font-semibold text-slate-300">
            {trustedPartners.map((p, i) => (
              <span key={i} className="hover:text-[#00F0FF] transition-colors cursor-default">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CARA MUDAH MENDAPATKAN TIKET (4-STEP HOW IT WORKS - ASTRO BENTO)       */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
            Alur Pemesanan Cepat
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cara Mudah Mendapatkan Tiket di TAQtix
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Proses pemesanan tiket resmi tanpa ribet, terverifikasi otomatis, dan langsung masuk ke WhatsApp Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {howItWorksSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="astro-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-[#08ADAE]/50 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-slate-950 transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-black text-white/20 group-hover:text-[#00F0FF]/50 transition-colors font-mono">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROMOTIONAL HERO BANNER CAROUSEL (ASTRO OBSIDIAN GLASS)                */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative astro-glass rounded-3xl overflow-hidden shadow-2xl text-white min-h-[380px] sm:min-h-[420px] flex flex-col justify-between border border-white/15">
          {/* Background Image with Deep Space Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover opacity-35 filter brightness-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
          </div>

          {/* Top Tag & Controls */}
          <div className="relative z-10 p-6 md:p-8 flex items-center justify-between">
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 rounded-full text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              {currentBanner.tag}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setActiveBannerIdx((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
                }
                className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setActiveBannerIdx((prev) => (prev + 1) % heroBanners.length)
                }
                className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
                aria-label="Next banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Details */}
          <div className="relative z-10 p-6 md:p-10 space-y-4 max-w-3xl">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
                {currentBanner.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {currentBanner.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-1">
              <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{currentBanner.date}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{currentBanner.location}</span>
              </div>
              <span className="text-[#F0B829] font-bold font-mono text-sm sm:text-base px-3 py-1 rounded-full bg-slate-900/60 border border-white/15">
                {currentBanner.price}
              </span>
            </div>

            <div className="pt-2">
              <Link
                href={currentBanner.targetUrl}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 text-slate-950 rounded-full text-xs sm:text-sm font-black transition shadow-[0_0_25px_rgba(8,173,174,0.45)] cursor-pointer active:scale-95"
              >
                <span>Lihat Detail & Beli Tiket</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="relative z-10 p-4 flex justify-center gap-2">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeBannerIdx === idx ? 'w-8 bg-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.6)]' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SLIDER EVENT PER KOTA / OFFICIAL EVENTS                                */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00F0FF]" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Official Event
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Event resmi yang bisa dibeli tiketnya langsung lewat TAQtix.
            </p>
          </div>

          {/* City Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer border',
                  selectedCity === city
                    ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                    : 'astro-glass text-slate-300 hover:text-white hover:border-white/25 border-white/10'
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Event Slider */}
        {cityEvents.length === 0 ? (
          <div className="p-8 text-center astro-glass rounded-2xl text-xs sm:text-sm text-slate-400 border border-white/10">
            Belum ada jadwal event di kota <span className="font-semibold text-white">{selectedCity}</span>. Coba pilih kota lain atau &quot;Semua Kota&quot;.
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
            {cityEvents.map((evt) => {
              const minPrice = evt.ticketCategories?.[0]?.price ?? 100000;
              return (
                <div key={evt.id} className="w-72 sm:w-80 shrink-0 snap-start">
                  <EventCard
                    id={evt.id}
                    slug={evt.slug}
                    title={evt.title}
                    description={evt.description}
                    bannerUrl={evt.bannerUrl}
                    location={evt.location}
                    startDate={evt.startDate}
                    endDate={evt.endDate}
                    isDateTba={evt.isDateTba}
                    organizer={evt.organizer}
                    minPrice={minPrice}
                    isOfficial={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. STAT COUNTER STRIP (ASTRO GLASS CAPSULE)                               */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="astro-glass rounded-2xl py-6 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-white/10 shadow-2xl">
          <div className="space-y-1">
            <p className="text-3xl font-black text-white">10k+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiket Terjual</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <p className="text-3xl font-black text-[#00F0FF]">50+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Sukses</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <p className="text-3xl font-black text-[#C084FC]">2.5k+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Afiliasi</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <p className="text-3xl font-black text-emerald-400">99.9%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sistem Uptime</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. DISCOVERY & EVENT GRID (ASTRO BENTO CATALOG)                           */}
      {/* ========================================================================= */}
      <section id="discovery-section" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00F0FF] mb-1">
              <Ticket className="w-3.5 h-3.5" />
              Katalog Acara
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Semua Event Unggulan
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-300 astro-glass-pill px-3.5 py-1.5 rounded-full border border-white/10">
            Menampilkan {filteredEvents.length} Event
          </span>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/60 border border-white/10 overflow-hidden rounded-3xl p-3.5 space-y-3">
                <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-slate-800/80" />
                <div className="p-2 space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-slate-800/80" />
                  <Skeleton className="h-4 w-1/2 bg-slate-800/80" />
                  <Skeleton className="h-4 w-2/3 bg-slate-800/80" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 astro-glass rounded-2xl border border-white/10">
            <Ticket className="mx-auto h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white">Tidak ada event ditemukan</h3>
            <p className="text-slate-400 text-xs mt-1">
              Coba cari dengan kata kunci lain atau ubah pilihan filter kategori/kota.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const minPrice = event.ticketCategories?.[0]?.price ?? 100000;
              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  title={event.title}
                  description={event.description}
                  bannerUrl={event.bannerUrl}
                  location={event.location}
                  startDate={event.startDate}
                  endDate={event.endDate}
                  isDateTba={event.isDateTba}
                  organizer={event.organizer}
                  minPrice={minPrice}
                  isOfficial={true}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. KEAMANAN & KEANDALAN TEKNOLOGI (SECURITY PILLARS - ASTRO BENTO)        */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
            Keamanan Tingkat Enterprise
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Standar Keamanan & Keandalan TAQtix
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Dibangun dengan infrastruktur modern untuk memastikan transaksi Anda 100% aman, bebas calo, dan bebas dari server crash.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="astro-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-[#00F0FF]/40 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2.5 py-1 rounded-full border border-[#00F0FF]/30">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SOLUSI PENYELENGGARA ACARA (ORGANIZER HUB - ASTRO BENTO)               */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl astro-glass p-8 sm:p-12 border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-[#060913]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                Solusi Event Organizer
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Kelola Penjualan Tiket Event Anda dengan Skalabilitas Tinggi
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Platform ticketing terintegrasi untuk promotor musik, festival, workshop, dan seminar. Mulai dari manajemen kategori tiket, integrasi QRIS/VA otomatis, hingga scanner kru gate lapangan.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/register'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 transition shadow-[0_0_24px_rgba(8,173,174,0.45)] cursor-pointer active:scale-95"
                >
                  <span>Mulai Bikin Event</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white astro-glass hover:bg-white/10 border border-white/15 transition cursor-pointer"
                >
                  <span>Konsultasi Kemitraan</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organizerBenefits.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl astro-card border border-white/10 hover:border-[#08ADAE]/50 bg-slate-900/70 space-y-2.5"
                  >
                    <div className="h-9 w-9 rounded-xl bg-[#08ADAE]/20 border border-[#08ADAE]/30 text-[#00F0FF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PANDUAN & CHECKLIST HARI-H (EVENT DAY CHECKLIST)                        */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
            Panduan Menonton Acara
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Checklist Hari-H Menghadiri Acara
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Pastikan pengalaman Anda menyaksikan acara impian berjalan lancar dan nyaman dengan tips berikut.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {eventDayChecklist.map((item, idx) => (
            <div
              key={idx}
              className="astro-card rounded-2xl p-6 space-y-3 relative overflow-hidden flex flex-col justify-between border border-white/10 hover:border-[#00F0FF]/40 bg-slate-900/60"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#00F0FF]">
                  <Check className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tips #{idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. TESTIMONI & ULASAN PENGGUNA (ASTRO BENTO SOCIAL PROOF)                 */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 border border-white/10">
            <Star className="w-3.5 h-3.5 text-[#F0B829]" />
            Testimoni Nyata
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Pengalaman Mereka Bersama TAQtix
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Dengarkan apa kata para penonton dan penyelenggara event yang telah merasakan kemudahan sistem TAQtix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userReviews.map((rev, idx) => (
            <div
              key={idx}
              className="astro-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-white/10 bg-slate-900/60 hover:border-white/20 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#F0B829]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &quot;{rev.comment}&quot;
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <h4 className="text-xs font-bold text-white">{rev.name}</h4>
                <p className="text-[11px] text-slate-400">{rev.role}</p>
                <span className="text-[10px] font-semibold text-[#00F0FF] mt-0.5 block">
                  Event: {rev.event}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQS ACCORDION (ASTRO OBSIDIAN ROWS)                                  */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="astro-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 inline-block border border-white/10">
            Pusat Bantuan
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Informasi lengkap seputar pemesanan dan verifikasi tiket di TAQtix.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="astro-card rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 hover:border-white/20 transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-white pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      'p-1.5 rounded-full transition-colors shrink-0',
                      isOpen ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950' : 'bg-white/10 text-slate-300'
                    )}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. CALL TO ACTION (ASTRO COSMIC AURORA BANNER)                           */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl astro-glass text-white p-8 sm:p-14 text-center border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#060913]">
          {/* Cosmic Aurora Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#08ADAE]/25 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-[#00F0FF] border border-white/15 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistem Ticketing Resmi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
              Siap Menghadiri Acara Impian Anda?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Jelajahi konser musik, festival, workshop, olahraga, pertunjukan seni, dan pameran terbaik sekarang. Atau daftarkan acaramu sendiri sebagai Event Organizer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#discovery-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-white hover:bg-slate-200 transition shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Cari & Beli Tiket</span>
                <ArrowRight className="w-4 h-4 text-[#08ADAE]" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/register'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 transition shadow-[0_0_24px_rgba(8,173,174,0.45)] active:scale-95 cursor-pointer"
              >
                <span>Daftar Sebagai EO</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplaceContent />
    </Suspense>
  );
}
