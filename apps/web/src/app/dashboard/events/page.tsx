'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Calendar, MapPin, Edit3, Ticket, TrendingUp, Users, HeartHandshake, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'CANCELLED' | 'draft' | 'published' | 'ended' | 'cancelled';
}

export default function OrganizerEventsPage() {
  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

  const events: Event[] = eventsResponse || [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Daftar Event Anda
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Kelola detail event, rincian kategori tiket, partner afiliasi, dan monitor dashboard penjualan.
          </p>
        </div>
        <Link href="/dashboard/events/new" className={cn(buttonVariants({ variant: 'default' }), "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl gap-2 font-bold cursor-pointer py-2 px-4 shadow-lg shadow-indigo-600/10 active:scale-[0.98] h-auto flex items-center")}>
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Buat Event</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed border-slate-855 rounded-2xl bg-slate-900/10">
          <p className="text-rose-400 text-sm">Gagal mengambil daftar event.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-855 rounded-2xl bg-slate-900/10 space-y-4">
          <p className="text-slate-400 text-sm">Anda belum mendaftarkan event apa pun.</p>
          <Link href="/dashboard/events/new" className={cn(buttonVariants({ variant: 'outline' }), "bg-slate-800 hover:bg-slate-755 text-slate-200 border border-slate-755 hover:border-transparent rounded-xl font-bold cursor-pointer px-4 py-2 h-auto inline-block")}>
            Buat Event Pertama Anda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const formattedDate = format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', {
              locale: localeId,
            });
            const statusUpper = event.status.toUpperCase();

            return (
              <Card
                key={event.id}
                className="bg-slate-900/30 border-slate-855 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-800 transition"
              >
                {/* Event Info */}
                <div className="space-y-3 max-w-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-250 leading-snug">{event.title}</h3>
                    {statusUpper === 'DRAFT' && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/25 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Draft
                      </Badge>
                    )}
                    {statusUpper === 'PUBLISHED' && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Published
                      </Badge>
                    )}
                    {statusUpper === 'ENDED' && (
                      <Badge className="bg-slate-800 text-slate-400 border-slate-755 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Ended
                      </Badge>
                    )}
                    {statusUpper === 'CANCELLED' && (
                      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/25 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Cancelled
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{formattedDate} WIB</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Event Actions Grid */}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/events/${event.id}/edit`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Edit</span>
                  </Link>

                  <Link href={`/dashboard/events/${event.id}/ticket-categories`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <Ticket className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Tiket</span>
                  </Link>

                  <Link href={`/dashboard/events/${event.id}/sales`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Sales</span>
                  </Link>

                  <Link href={`/dashboard/events/${event.id}/buyers`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Buyer</span>
                  </Link>

                  <Link href={`/dashboard/events/${event.id}/partners`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <HeartHandshake className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Partner</span>
                  </Link>

                  <Link href={`/dashboard/events/${event.id}/live`} className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-855 hover:border-slate-800 rounded-lg text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5")}>
                    <Eye className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Live</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
