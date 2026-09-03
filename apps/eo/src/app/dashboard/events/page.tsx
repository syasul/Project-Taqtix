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
import { Card } from '@/components/ui/card';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Event Anda
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola detail event, rincian kategori tiket, partner afiliasi, dan monitor dashboard penjualan.
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl gap-2 font-bold cursor-pointer py-2.5 px-4 shadow-sm h-auto flex items-center text-xs border-0'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Event Baru</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-rose-500 text-xs">Gagal mengambil daftar event.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white space-y-4">
          <p className="text-slate-400 text-xs">Anda belum mendaftarkan event apa pun.</p>
          <Link
            href="/dashboard/events/new"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer px-4 py-2 text-xs inline-block'
            )}
          >
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
                className="bg-white border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:border-slate-300 transition rounded-2xl"
              >
                {/* Event Info */}
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{event.title}</h3>
                    {statusUpper === 'DRAFT' && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Draft
                      </Badge>
                    )}
                    {statusUpper === 'PUBLISHED' && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Published
                      </Badge>
                    )}
                    {statusUpper === 'ENDED' && (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Ended
                      </Badge>
                    )}
                    {statusUpper === 'CANCELLED' && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Cancelled
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formattedDate} WIB</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Event Actions Grid */}
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={`/dashboard/events/${event.id}/edit`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#08B4B5]" />
                    <span>Edit</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${event.id}/ticket-categories`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <Ticket className="h-3.5 w-3.5 text-[#08B4B5]" />
                    <span>Tiket</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${event.id}/sales`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-[#08B4B5]" />
                    <span>Sales</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${event.id}/buyers`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <Users className="h-3.5 w-3.5 text-[#08B4B5]" />
                    <span>Buyer</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${event.id}/partners`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <HeartHandshake className="h-3.5 w-3.5 text-[#08B4B5]" />
                    <span>Partner</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${event.id}/live`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5 text-[#08B4B5]" />
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
