'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Search,
  MapPin,
  Ticket,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { EventCard } from '@/components/event/event-card';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
    logoUrl?: string;
  };
  ticketCategories?: {
    price: number;
  }[];
}

const CATEGORIES = [
  'Semua Event',
  'Konser & Festival Musik',
  'Workshop, Seminar & Konferensi',
  'Sport & Olahraga',
  'Pertunjukan Seni & Budaya',
  'Event Komunitas & Gathering',
  'Event Religi & Sosial',
  'Pameran & Exhibition',
];

function EventsPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || 'Semua Event';
  const initialQuery = searchParams?.get('q') || '';

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState('Semua Kota');

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data;
    },
  });

  const events: Event[] = eventsResponse?.data || [];

  // Extract unique cities from events
  const cities = useMemo(() => {
    const list = new Set<string>();
    events.forEach((e) => {
      if (e.location) {
        const parts = e.location.split(',');
        const cityCandidate = parts[0]?.trim();
        if (cityCandidate && cityCandidate.length > 2) {
          list.add(cityCandidate);
        }
      }
    });
    return ['Semua Kota', ...Array.from(list)];
  }, [events]);

  // Filter based on search query, category, and city
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.organizer?.name && e.organizer.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filter Kota
      if (selectedCity !== 'Semua Kota') {
        if (!e.location.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Filter Kategori
      if (selectedCategory === 'Semua Event' || selectedCategory === 'Semua') {
        return true;
      }
      if (selectedCategory === 'Konser & Festival Musik') {
        return (
          e.title.toLowerCase().includes('concert') ||
          e.title.toLowerCase().includes('konser') ||
          e.title.toLowerCase().includes('musik') ||
          e.title.toLowerCase().includes('music') ||
          e.title.toLowerCase().includes('festival') ||
          e.title.toLowerCase().includes('fest')
        );
      }
      if (selectedCategory === 'Workshop, Seminar & Konferensi') {
        return (
          e.title.toLowerCase().includes('workshop') ||
          e.title.toLowerCase().includes('seminar') ||
          e.title.toLowerCase().includes('konferensi') ||
          e.title.toLowerCase().includes('kelas') ||
          e.title.toLowerCase().includes('pelatihan')
        );
      }
      if (selectedCategory === 'Sport & Olahraga') {
        return (
          e.title.toLowerCase().includes('sport') ||
          e.title.toLowerCase().includes('lari') ||
          e.title.toLowerCase().includes('marathon') ||
          e.title.toLowerCase().includes('olahraga')
        );
      }
      if (selectedCategory === 'Pertunjukan Seni & Budaya') {
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
      if (selectedCategory === 'Event Religi & Sosial') {
        return (
          e.title.toLowerCase().includes('religi') ||
          e.title.toLowerCase().includes('kajian') ||
          e.title.toLowerCase().includes('sosial') ||
          e.title.toLowerCase().includes('amal')
        );
      }
      if (selectedCategory === 'Pameran & Exhibition') {
        return (
          e.title.toLowerCase().includes('pameran') ||
          e.title.toLowerCase().includes('expo') ||
          e.title.toLowerCase().includes('exhibition') ||
          e.title.toLowerCase().includes('fair')
        );
      }

      return true;
    });
  }, [events, search, selectedCategory, selectedCity]);

  const handleResetFilter = () => {
    setSearch('');
    setSelectedCategory('Semua Event');
    setSelectedCity('Semua Kota');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER                                                            */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#08ADAE]/10 border border-[#08ADAE]/20 text-[#08ADAE] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Compass className="w-4 h-4" />
            <span>Katalog Event Resmi TAQtix</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Semua Event Pilihan di <span className="text-[#08ADAE]">TAQtix</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Temukan konser musik, festival, seminar, workshop, hingga agenda komunitas favorit Anda. Seluruh tiket 100% resmi langsung dari penyelenggara terverifikasi dengan verifikasi e-ticket instan.
          </p>
        </div>

        {/* Search Bar & City Selector */}
        <div className="max-w-4xl mx-auto mt-8 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Input Kata Kunci */}
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama event, artis, lokasi, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#08ADAE] focus:ring-1 focus:ring-[#08ADAE] transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector Kota */}
            <div className="relative w-full sm:w-56 shrink-0">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#08ADAE]" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#08ADAE] focus:ring-1 focus:ring-[#08ADAE] transition appearance-none cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="max-w-5xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#08ADAE] text-white shadow-xs scale-100'
                    : 'bg-white hover:bg-slate-100/80 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EVENT CATALOG GRID                                                     */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Daftar Event Tersedia
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {filteredEvents.length} Event
            </span>
          </div>

          {(search || selectedCategory !== 'Semua Event' || selectedCity !== 'Semua Kota') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="text-xs font-bold text-[#08ADAE] hover:bg-[#08ADAE]/10 h-8 px-3 rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </Button>
          )}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="bg-white border border-slate-200 overflow-hidden shadow-xs rounded-3xl p-3.5 space-y-3"
              >
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
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tidak ada event yang sesuai</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
              Tidak ditemukan event untuk kata kunci atau kombinasi filter yang Anda pilih. Silakan reset filter untuk melihat seluruh katalog.
            </p>
            <Button
              onClick={handleResetFilter}
              className="bg-[#08ADAE] hover:bg-[#07999a] text-white rounded-xl text-xs font-bold shadow-xs px-5"
            >
              Tampilkan Semua Event
            </Button>
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
      {/* 3. VALUE PROPOSITION BANNER                                               */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg border border-slate-700/50">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#08ADAE] text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-4 h-4" />
              <span>Infrastruktur Ticketing Resmi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Ingin Menyelenggarakan Event Anda Sendiri di TAQtix?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Publikasikan acara Anda, kelola penjualan tiket, sistem gate check-in kru berkecepatan tinggi, dan dapatkan laporan keuangan terperinci secara otomatis.
            </p>
            <div className="pt-2">
              <a
                href={process.env.NEXT_PUBLIC_EO_URL || 'https://partner.taqtix.id'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#08ADAE] hover:bg-[#07999a] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <span>Buka Portal Partner (EO)</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center text-slate-400 text-xs font-semibold">
          Memuat katalog event...
        </div>
      }
    >
      <EventsPageContent />
    </Suspense>
  );
}
