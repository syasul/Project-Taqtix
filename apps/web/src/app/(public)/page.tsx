'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
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
}

// Kategori jumbotron dengan penambahan: Art & Culture, Workshop, Sport (Requirement 13)
const categories = [
  'Semua',
  'Konser',
  'Kajian',
  'Bazaar & Culinary',
  'Art & Culture',
  'Workshop',
  'Sport',
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

// Promotional Hero Banners managed by Admin (Requirement 14)
const heroBanners = [
  {
    id: 'bnr-1',
    title: 'Taqwa Movement Concert 2026',
    subtitle: 'Simfoni Religi Akbar & Kolaborasi Musisi Terkemuka',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/event/taqwa-movement-2026',
    tag: 'EVENT PILIHAN',
    price: 'Mulai Rp 100.000',
    date: '12 September 2026',
    location: 'Jakarta Convention Center',
  },
  {
    id: 'bnr-2',
    title: 'Festival Hijrah & Halal Expo 2026',
    subtitle: 'Eksibisi Halal Lifestyle & Kuliner Terbesar Se-Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/event/fest-hijrah-halal-culinary-2026',
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

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCity, setSelectedCity] = useState('Semua Kota');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

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

  // Filter based on Search and Jumbotron Categories (Requirement 13)
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());

    if (selectedCategory === 'Semua') return matchesSearch;
    if (selectedCategory === 'Konser') {
      return (
        matchesSearch &&
        (e.title.toLowerCase().includes('concert') ||
          e.title.toLowerCase().includes('sholawat') ||
          e.title.toLowerCase().includes('simfoni') ||
          e.title.toLowerCase().includes('musik'))
      );
    }
    if (selectedCategory === 'Kajian') {
      return matchesSearch && e.title.toLowerCase().includes('kajian');
    }
    if (selectedCategory === 'Bazaar & Culinary') {
      return (
        matchesSearch &&
        (e.title.toLowerCase().includes('culinary') ||
          e.title.toLowerCase().includes('fest') ||
          e.title.toLowerCase().includes('hijrah') ||
          e.title.toLowerCase().includes('bazaar'))
      );
    }
    if (selectedCategory === 'Art & Culture') {
      return (
        matchesSearch &&
        (e.title.toLowerCase().includes('art') ||
          e.title.toLowerCase().includes('culture') ||
          e.title.toLowerCase().includes('budaya') ||
          e.title.toLowerCase().includes('seni') ||
          e.title.toLowerCase().includes('pameran'))
      );
    }
    if (selectedCategory === 'Workshop') {
      return (
        matchesSearch &&
        (e.title.toLowerCase().includes('workshop') ||
          e.title.toLowerCase().includes('kelas') ||
          e.title.toLowerCase().includes('pelatihan'))
      );
    }
    if (selectedCategory === 'Sport') {
      return (
        matchesSearch &&
        (e.title.toLowerCase().includes('sport') ||
          e.title.toLowerCase().includes('lari') ||
          e.title.toLowerCase().includes('marathon') ||
          e.title.toLowerCase().includes('olahraga'))
      );
    }
    return matchesSearch;
  });

  // Events filtered by City for the Slider (Requirement 12)
  const cityEvents = events.filter((e) => {
    if (selectedCity === 'Semua Kota') return true;
    return e.location.toLowerCase().includes(selectedCity.toLowerCase());
  });

  const currentBanner = heroBanners[activeBannerIdx];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Hero Section & Jumbotron */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Temukan Event Terbaik & Dapatkan Tiket Anda
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
          Infrastruktur ticketing modern anti double-booking untuk pengalaman festival, konser, workshop, kajian, dan olahraga terbaik.
        </p>

        {/* Search & Jumbotron Category Pills (Requirement 13) */}
        <div className="space-y-6 max-w-2xl mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari konser, festival, art & culture, workshop, sport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-800 focus:border-[#08B4B5] focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 text-sm shadow-sm transition"
            />
          </div>

          {/* Jumbotron Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-[#08B4B5] border-[#08B4B5] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HERO BANNER CAROUSEL DARI MAIN ADMIN (Requirement 14) */}
      <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800 text-white min-h-[360px] flex flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover opacity-35 filter brightness-90 transition-all duration-700 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        {/* Top Tag & Nav */}
        <div className="relative z-10 p-6 md:p-8 flex items-center justify-between">
          <span className="px-3.5 py-1 bg-[#08B4B5] text-white rounded-full text-xs font-extrabold tracking-wider uppercase shadow-sm">
            {currentBanner.tag}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setActiveBannerIdx((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
              }
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setActiveBannerIdx((prev) => (prev + 1) % heroBanners.length)
              }
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner Details */}
        <div className="relative z-10 p-6 md:p-8 space-y-4 max-w-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
              {currentBanner.title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {currentBanner.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#08B4B5]" />
              <span>{currentBanner.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#08B4B5]" />
              <span>{currentBanner.location}</span>
            </div>
            <span className="text-[#08B4B5] font-bold font-mono text-sm">
              {currentBanner.price}
            </span>
          </div>

          <div className="pt-2">
            <Link
              href={currentBanner.targetUrl}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                activeBannerIdx === idx ? 'w-8 bg-[#08B4B5]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* SLIDER EVENT PER KOTA (Requirement 12) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#08B4B5]" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Jelajahi Event per Kota
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Temukan berbagai festival, konser, dan workshop seru yang diselenggarakan di kota Anda.
            </p>
          </div>

          {/* City Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  selectedCity === city
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Event Slider per Kota */}
        {cityEvents.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-xs text-slate-400">
            Belum ada jadwal event di kota {selectedCity}. Coba pilih kota lain atau "Semua Kota".
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
            {cityEvents.map((evt) => (
              <div
                key={evt.id}
                className="w-72 sm:w-80 shrink-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between snap-start group"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  {evt.bannerUrl ? (
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Ticket className="w-10 h-10 text-[#08B4B5]/30" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs text-slate-800 rounded-lg text-[10px] font-extrabold shadow-xs">
                    {evt.location.split(',')[0]}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {evt.organizer.name}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {evt.title}
                    </h3>
                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#08B4B5] shrink-0" />
                        <span className="text-[11px]">
                          {format(new Date(evt.startDate), 'd MMM yyyy', { locale: localeId })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#08B4B5] shrink-0" />
                        <span className="text-[11px] truncate">{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tiket mulai</span>
                      <span className="text-xs font-bold text-[#08B4B5]">Rp 100.000</span>
                    </div>
                    <Link
                      href={`/event/${evt.slug}`}
                      className="px-3.5 py-1.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Beli Tiket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat Counter */}
      <div className="bg-white border border-slate-200 rounded-3xl py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-sm">
        <div className="space-y-1">
          <p className="text-3xl font-extrabold text-[#08B4B5]">10k+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiket Terjual</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-[#08B4B5]">50+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Sukses</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-[#08B4B5]">2.5k+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner Afiliasi</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-[#08B4B5]">99.9%</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistem Uptime</p>
        </div>
      </div>

      {/* All Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Semua Event Unggulan</h2>
          <span className="text-xs font-medium text-slate-500">
            Menampilkan {filteredEvents.length} Event
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full bg-slate-100" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-4 w-1/4 bg-slate-100" />
                  <Skeleton className="h-6 w-3/4 bg-slate-100" />
                  <Skeleton className="h-4 w-full bg-slate-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <Ticket className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Tidak ada event ditemukan</h3>
            <p className="text-slate-500 text-xs mt-1">
              Coba cari dengan kata kunci lain atau pilih kategori "Semua".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-50">
                        <Ticket className="h-12 w-12 text-[#08B4B5]/30" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs">
                      {event.location.split(',')[0]}
                    </span>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#08B4B5] uppercase tracking-wider">
                        {event.organizer.name}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
                        {event.title}
                      </h3>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-[#08B4B5] shrink-0" />
                        <span>
                          {format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', { locale: localeId })} WIB
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-[#08B4B5] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100/60 flex items-center justify-between mt-auto">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-medium">Tiket Mulai</span>
                    <span className="text-sm font-extrabold text-[#08B4B5]">Rp 100.000</span>
                  </div>
                  <Link
                    href={`/event/${event.slug}`}
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold px-4 py-2 rounded-xl transition shadow-xs text-xs flex items-center gap-1.5 cursor-pointer border-0'
                    )}
                  >
                    <span>Beli Tiket</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
