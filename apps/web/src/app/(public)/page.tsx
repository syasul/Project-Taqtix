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
    a: 'Cukup tunjukkan barcode atau QR code langsung dari pesan WhatsApp Anda ke kru di pintu masuk. Scanner kru kami memproses validasi tiket dalam <0.4 detik tanpa hambatan antrean.',
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

  // Filter based on Search and Category (Requirement 13)
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
    <div className="space-y-16 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (LIQUID GLASS CAPSULE & FROSTED PANELS)                  */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-4 sm:pt-8 space-y-6">
          {recentOrder && (
            <Link
              href="/tickets"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#08ADAE]/10 border border-[#08ADAE]/30 text-[#08ADAE] hover:bg-[#08ADAE]/20 transition flex items-center gap-2 shadow-xs group"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Kamu memiliki transaksi tiket di perangkat ini</span>
              <span className="underline group-hover:translate-x-0.5 transition-transform flex items-center">
                Lihat Semua Tiket
                <ArrowRight className="w-3 h-3 ml-0.5 inline" />
              </span>
            </Link>
          )}

          {/* Liquid Glass Badge */}
          <div className="liquid-glass-pill px-4 py-1.5 rounded-full inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#08ADAE] ring-4 ring-[#08ADAE]/20" />
            <span>Temukan event seru di sekitarmu</span>
          </div>

          {/* Main Headline (Solid Colors) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Temukan Acara Favorit.{' '}
            <span className="text-[#08ADAE]">Beli Tiket Resmi</span> Tanpa Ribet.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">
            Cari konser, festival, workshop, olahraga, pertunjukan seni, dan berbagai pengalaman menarik lainnya. Temukan event favoritmu dan pesan tiketnya dengan mudah di TAQtix.
          </p>

          {/* Liquid Glass Unified Search Dock */}
          <div className="w-full max-w-3xl mt-2 p-2 liquid-glass-pill rounded-2xl sm:rounded-full shadow-lg flex flex-col sm:flex-row items-center gap-2 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 px-4 py-2 w-full sm:w-auto flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari konser, festival, workshop, olahraga, seni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            <div className="h-5 w-px bg-slate-200/80 hidden sm:block" />

            <div className="flex items-center gap-2 px-3 py-2 w-full sm:w-44 border-t sm:border-t-0 border-slate-100">
              <MapPin className="h-4 w-4 text-[#08ADAE] shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
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
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#08ADAE] hover:bg-[#07999A] text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_4px_14px_rgba(8,173,174,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95"
            >
              <span>Cari Event</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Category Pills with Liquid Glass Feel */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'liquid-glass-card text-slate-700 hover:text-slate-900 hover:bg-white/90'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AUTHENTIC LIQUID GLASS TICKET & CAPABILITIES PANEL */}
        <div className="mt-12 max-w-5xl mx-auto rounded-3xl liquid-glass p-6 sm:p-9 shadow-xl relative overflow-hidden">
          {/* Subtle Top Specular Glass Reflection Highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/90" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Authentic Liquid Glass Ticket Pass */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl liquid-glass-card p-5.5 relative overflow-hidden border border-white/90 shadow-lg">
                {/* Glass Notch Perforation Effect */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Tiket Terkonfirmasi
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#08ADAE] bg-[#08ADAE]/10 px-2.5 py-0.5 rounded-full border border-[#08ADAE]/20">
                    VIP ACCESS
                  </span>
                </div>

                {/* Event Details */}
                <div className="py-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TAQtix Event Partner
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    Nusantara Live Music Festival 2026
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#08ADAE]" />
                      12 Sep 2026
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#08ADAE]" />
                      JCC Senayan
                    </span>
                  </div>
                </div>

                {/* Perforation Line with Side Notches */}
                <div className="relative my-2">
                  <div className="border-t border-dashed border-slate-300" />
                  <div className="absolute -left-8 -top-2.5 h-5 w-5 rounded-full bg-slate-50 border-r border-slate-200" />
                  <div className="absolute -right-8 -top-2.5 h-5 w-5 rounded-full bg-slate-50 border-l border-slate-200" />
                </div>

                {/* Barcode / QR Section */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/90 border border-white rounded-xl shadow-xs">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-mono font-bold text-slate-800">
                        TQTX-2026-X8921
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Scan di Gate 3A (Kru Scanner)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Bayar</span>
                    <span className="text-xs font-black text-slate-900">Rp 250.000</span>
                  </div>
                </div>

                {/* WhatsApp badge footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Terkirim ke WhatsApp
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">STATUS: PAID</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Capabilities (Frosted Glass Tiles) */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#08ADAE] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Infrastruktur Ticketing Andal
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Pengalaman Transaksi Bebas Masalah
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  TAQtix dirancang untuk memastikan setiap detik proses pembelian hingga gate check-in berjalan lancar dan aman.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-card">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Tiket Resmi, Lebih Tenang
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      Beli tiket melalui kanal resmi event yang tersedia di TAQtix.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-card">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Tiket Digital, Praktis Diakses
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      Temukan tiket dan informasi akses setelah transaksi berhasil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-card">
                  <div className="h-8 w-8 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Check-in Lebih Praktis
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      Proses masuk event dengan sistem pemindaian tiket, jika fitur tersebut digunakan oleh penyelenggara.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ORGANIZER & PARTNER LIQUID GLASS STRIP */}
        <div className="mt-12 py-5 px-6 rounded-2xl liquid-glass border border-white/80">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3.5">
            Dipercaya oleh Penyelenggara Event & Festival Terkemuka
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs sm:text-sm font-bold text-slate-600">
            {trustedPartners.map((p, i) => (
              <span key={i} className="hover:text-[#08ADAE] transition-colors cursor-default">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CARA MUDAH MENDAPATKAN TIKET (4-STEP HOW IT WORKS)                     */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#08ADAE]" />
            Alur Pemesanan Cepat
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cara Mudah Mendapatkan Tiket di TAQtix
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Proses pemesanan tiket resmi tanpa ribet, terverifikasi otomatis, dan langsung masuk ke WhatsApp Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {howItWorksSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="liquid-glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE] group-hover:bg-[#08ADAE] group-hover:text-white transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 group-hover:text-[#08ADAE]/40 transition-colors font-mono">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROMOTIONAL HERO BANNER CAROUSEL (SMOKED OBSIDIAN GLASS)               */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative liquid-glass-dark rounded-3xl overflow-hidden shadow-2xl text-white min-h-[380px] sm:min-h-[420px] flex flex-col justify-between border border-white/15">
          {/* Background Image with Solid Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover opacity-35 filter brightness-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-slate-950/60" />
          </div>

          {/* Top Tag & Controls */}
          <div className="relative z-10 p-6 md:p-8 flex items-center justify-between">
            <span className="px-4 py-1.5 bg-[#08ADAE] text-white rounded-full text-xs font-extrabold tracking-wider uppercase shadow-[0_2px_10px_rgba(8,173,174,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]">
              {currentBanner.tag}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setActiveBannerIdx((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
                }
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setActiveBannerIdx((prev) => (prev + 1) % heroBanners.length)
                }
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
                aria-label="Next banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Details */}
          <div className="relative z-10 p-6 md:p-10 space-y-4 max-w-3xl">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                {currentBanner.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {currentBanner.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-1">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5 text-[#08ADAE]" />
                <span>{currentBanner.date}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-[#08ADAE]" />
                <span>{currentBanner.location}</span>
              </div>
              <span className="text-[#F0B829] font-bold font-mono text-sm sm:text-base px-3 py-1 rounded-full bg-white/10 border border-white/15">
                {currentBanner.price}
              </span>
            </div>

            <div className="pt-2">
              <Link
                href={currentBanner.targetUrl}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#08ADAE] hover:bg-[#07999A] text-white rounded-full text-xs sm:text-sm font-bold transition shadow-[0_4px_14px_rgba(8,173,174,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] cursor-pointer active:scale-95"
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
                  activeBannerIdx === idx ? 'w-8 bg-[#08ADAE]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SLIDER EVENT PER KOTA / OFFICIAL EVENTS                                */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#08ADAE]" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Official Event
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
                  'px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer',
                  selectedCity === city
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'liquid-glass-card text-slate-700 hover:bg-white/90 hover:text-slate-900'
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Event Slider */}
        {cityEvents.length === 0 ? (
          <div className="p-8 text-center liquid-glass rounded-2xl text-xs sm:text-sm text-slate-500">
            Belum ada jadwal event di kota <span className="font-semibold text-slate-700">{selectedCity}</span>. Coba pilih kota lain atau &quot;Semua Kota&quot;.
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
      {/* 4. STAT COUNTER STRIP (LIQUID GLASS CAPSULE)                               */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="liquid-glass rounded-2xl py-6 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-sm">
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-900">10k+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiket Terjual</p>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <p className="text-3xl font-black text-[#08ADAE]">50+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Sukses</p>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <p className="text-3xl font-black text-slate-900">2.5k+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Afiliasi</p>
          </div>
          <div className="space-y-1 border-l border-slate-200/80">
            <p className="text-3xl font-black text-emerald-600">99.9%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sistem Uptime</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DISCOVERY & EVENT GRID (SEARCH + PILLS + FROSTED CARDS)                */}
      {/* ========================================================================= */}
      <section id="discovery-section" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#08ADAE] mb-1">
              <Ticket className="w-3.5 h-3.5" />
              Katalog Acara
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Semua Event Unggulan
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-600 liquid-glass-pill px-3.5 py-1.5 rounded-full shadow-xs">
            Menampilkan {filteredEvents.length} Event
          </span>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white border border-slate-200 overflow-hidden shadow-xs rounded-3xl p-3.5 space-y-3">
                <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-slate-200/60" />
                <div className="p-2 space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-slate-200/60" />
                  <Skeleton className="h-4 w-1/2 bg-slate-200/60" />
                  <Skeleton className="h-4 w-2/3 bg-slate-200/60" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 liquid-glass rounded-2xl shadow-xs">
            <Ticket className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada event ditemukan</h3>
            <p className="text-slate-500 text-xs mt-1">
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
      {/* 7. KEAMANAN & KEANDALAN TEKNOLOGI (SECURITY & RELIABILITY PILLARS)        */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#08ADAE]" />
            Keamanan Tingkat Enterprise
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Standar Keamanan & Keandalan TAQtix
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Dibangun dengan infrastruktur modern untuk memastikan transaksi Anda 100% aman, bebas calo, dan bebas dari server crash.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="liquid-glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-[#08ADAE]/10 border border-[#08ADAE]/20 flex items-center justify-center text-[#08ADAE]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#08ADAE] bg-[#08ADAE]/10 px-2.5 py-1 rounded-full border border-[#08ADAE]/20">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SOLUSI PENYELENGGARA ACARA (EVENT ORGANIZER & PROMOTER HUB)             */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl liquid-glass p-8 sm:p-12 border border-slate-200/80 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#08ADAE]" />
                Solusi Event Organizer
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Kelola Penjualan Tiket Event Anda dengan Skalabilitas Tinggi
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Platform ticketing terintegrasi untuk promotor musik, festival, workshop, dan seminar. Mulai dari manajemen kategori tiket, integrasi QRIS/VA otomatis, hingga scanner kru gate lapangan.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/register'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#08ADAE] hover:bg-[#07999A] transition shadow-[0_4px_14px_rgba(8,173,174,0.35)] cursor-pointer active:scale-95"
                >
                  <span>Mulai Bikin Event</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer shadow-2xs"
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
                    className="p-5 rounded-2xl liquid-glass-card border border-white/90 shadow-2xs space-y-2.5"
                  >
                    <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#08ADAE]" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
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
          <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#08ADAE]" />
            Panduan Menonton Acara
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Checklist Hari-H Menghadiri Acara
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Pastikan pengalaman Anda menyaksikan acara impian berjalan lancar dan nyaman dengan tips berikut.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {eventDayChecklist.map((item, idx) => (
            <div
              key={idx}
              className="liquid-glass-card rounded-2xl p-6 space-y-3 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#08ADAE]">
                  <Check className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tips #{idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. TESTIMONI & ULASAN PENGGUNA (SOCIAL PROOF)                             */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#F0B829]" />
            Testimoni Nyata
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pengalaman Mereka Bersama TAQtix
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Dengarkan apa kata para penonton dan penyelenggara event yang telah merasakan kemudahan sistem TAQtix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userReviews.map((rev, idx) => (
            <div
              key={idx}
              className="liquid-glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#F0B829]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-900">{rev.name}</h4>
                <p className="text-[11px] text-slate-500">{rev.role}</p>
                <span className="text-[10px] font-semibold text-[#08ADAE] mt-0.5 block">
                  Event: {rev.event}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQS ACCORDION (FROSTED LIQUID GLASS ROWS)                            */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="liquid-glass-pill px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 inline-block">
            Pusat Bantuan
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Informasi lengkap seputar pemesanan dan verifikasi tiket di TAQtix.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="liquid-glass-card rounded-2xl overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-white/90 transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      'p-1.5 rounded-full transition-colors shrink-0',
                      isOpen ? 'bg-[#08ADAE] text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/70 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. CALL TO ACTION (SMOKED LIQUID GLASS CONTAINER)                        */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl liquid-glass-dark text-white p-8 sm:p-14 text-center border border-white/15 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Specular Glass Reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25" />

          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-[#08ADAE] border border-white/15 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistem Ticketing Resmi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
              Siap Menghadiri Acara Impian Anda?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Jelajahi konser musik, festival, workshop, olahraga, pertunjukan seni, dan pameran terbaik sekarang. Atau daftarkan acaramu sendiri sebagai Event Organizer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#discovery-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 transition shadow-lg active:scale-95"
              >
                <span>Cari & Beli Tiket</span>
                <ArrowRight className="w-4 h-4 text-[#08ADAE]" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/register'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#08ADAE] hover:bg-[#07999A] transition shadow-[0_4px_14px_rgba(8,173,174,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95"
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
