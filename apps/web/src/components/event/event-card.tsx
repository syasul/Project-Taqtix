'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Building2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface EventCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate?: string;
  organizer?: {
    name: string;
  };
  minPrice?: number;
  className?: string;
}

export function EventCard({
  slug,
  title,
  bannerUrl,
  location,
  startDate,
  organizer,
  minPrice,
  className,
}: EventCardProps) {
  const formattedDate = format(new Date(startDate), 'd MMMM yyyy, HH:mm', {
    locale: localeId,
  });

  return (
    <Link href={`/event/${slug}`} className={cn('group block h-full', className)}>
      <Card className="h-full bg-white border-slate-200 hover:border-[#08B4B5]/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col">
        {/* Banner image */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          <Image
            src={bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {organizer && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#08B4B5] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{organizer.name}</span>
              </p>
            )}
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#08B4B5] transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formattedDate} WIB</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Mulai dari</span>
              <span className="font-extrabold text-slate-900 font-mono text-sm">
                {minPrice !== undefined
                  ? minPrice === 0
                    ? 'Gratis'
                    : minPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
                  : 'Lihat Tiket'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-bold text-[#08B4B5] group-hover:translate-x-1 transition-transform">
              Beli Tiket
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default EventCard;
