'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Search, ArrowRight } from 'lucide-react';
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

export default function MarketplacePage() {
  const [search, setSearch] = React.useState('');

  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data;
    },
  });

  const events: Event[] = eventsResponse?.data || [];

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
          Temukan Event Terbaik & Dapatkan Tiket Anda
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Infrastruktur ticketing modern anti double-booking untuk pengalaman festival, konser, dan kajian religi terbaik.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mt-6">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari konser, festival, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 pl-12 pr-4 py-3.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm backdrop-blur-sm transition"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-200">Event Unggulan</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900/40 border-slate-855 overflow-hidden">
                <Skeleton className="h-48 w-full bg-slate-800" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4 bg-slate-855" />
                  <Skeleton className="h-4 w-1/2 bg-slate-855" />
                  <Skeleton className="h-4 w-2/3 bg-slate-855" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-dashed border-slate-855 rounded-2xl bg-slate-900/10">
            <p className="text-rose-400 text-sm">Gagal memuat event. Silakan coba beberapa saat lagi.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-855 rounded-2xl bg-slate-900/10">
            <p className="text-slate-400 text-sm">Tidak ada event yang ditemukan matching pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const formattedDate = format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', {
                locale: localeId,
              });

              return (
                <Card
                  key={event.id}
                  className="bg-slate-900/40 border-slate-855 hover:border-slate-700/80 transition duration-300 overflow-hidden group flex flex-col justify-between"
                >
                  <div>
                    {/* Event Banner */}
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                      {event.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                          <Calendar className="h-10 w-10 text-indigo-500/50" />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 text-[10px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                        {event.organizer.name}
                      </span>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition">
                        {event.title}
                      </h3>

                      <div className="space-y-2 text-xs text-slate-400 font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{formattedDate} WIB</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/event/${event.slug}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        "w-full bg-slate-850 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-800 hover:border-transparent transition flex items-center justify-center gap-2 rounded-xl py-2 font-bold cursor-pointer h-auto"
                      )}
                    >
                      <span>Detail & Beli Tiket</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
