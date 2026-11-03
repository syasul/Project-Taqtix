'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Building2, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface EventCardProps {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate?: string;
  isDateTba?: boolean;
  organizer?: {
    name: string;
    avatarUrl?: string;
  };
  minPrice?: number;
  isOfficial?: boolean;
  className?: string;
}

export function EventCard({
  slug,
  title,
  bannerUrl,
  location,
  startDate,
  isDateTba = false,
  organizer,
  minPrice,
  isOfficial = true,
  className,
}: EventCardProps) {
  let formattedDate = '';
  if (isDateTba) {
    formattedDate = 'Tanggal & Waktu TBA';
  } else {
    try {
      formattedDate = format(new Date(startDate), 'd MMM yyyy • HH:mm', {
        locale: localeId,
      });
    } catch {
      formattedDate = startDate;
    }
  }

  const formattedPrice =
    minPrice !== undefined
      ? minPrice === 0
        ? 'Mulai Rp 0'
        : `Mulai Rp ${minPrice.toLocaleString('id-ID')}`
      : 'Mulai Rp 100.000';

  const defaultBanner = '/default-banner.svg';

  return (
    <Link href={`/event/${slug}`} className={cn('group block h-full select-none', className)}>
      <div className="h-full bg-white border border-slate-200/90 hover:border-[#08B4B5]/40 rounded-3xl p-3 sm:p-3.5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
        {/* Banner image memanjang (landscape 16:9) */}
        <div className="relative w-full aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden shrink-0">
          <img
            src={bannerUrl || defaultBanner}
            alt={title}
            onError={(e) => {
              if (e.currentTarget.src !== defaultBanner && !e.currentTarget.src.endsWith(defaultBanner)) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultBanner;
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badge TBA (Top Left) */}
          {isDateTba && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Clock className="w-3 h-3 text-white" />
              <span className="tracking-wide">TBA</span>
            </div>
          )}

          {/* Badge Resmi (Top Right) */}
          {isOfficial && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#1877F2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <CheckCircle2 className="w-3 h-3 fill-white text-[#1877F2]" />
              <span className="tracking-wide">RESMI</span>
            </div>
          )}

          {/* Badge Harga Mulai (Bottom Right) */}
          <div className="absolute bottom-2.5 right-2.5 bg-[#FBBF24] text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs tracking-tight">
            {formattedPrice}
          </div>
        </div>

        {/* Content Details */}
        <div className="pt-3 px-1 pb-0.5 flex-1 flex flex-col justify-between space-y-2.5">
          <div className="space-y-1.5">
            {/* Title */}
            <h3 className="font-extrabold text-slate-900 group-hover:text-[#08ADAE] transition-colors text-sm sm:text-base uppercase tracking-tight line-clamp-1 leading-snug">
              {title}
            </h3>

            {/* Date & Location */}
            <div className="space-y-1 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className={cn('w-3.5 h-3.5 shrink-0', isDateTba ? 'text-amber-500' : 'text-blue-500')} />
                <span className={cn('truncate', isDateTba && 'text-amber-600 font-semibold')}>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-auto">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0 uppercase overflow-hidden">
              {organizer?.avatarUrl ? (
                <img src={organizer.avatarUrl} alt={organizer.name} className="w-full h-full object-cover" />
              ) : organizer?.name ? (
                organizer.name.substring(0, 2)
              ) : (
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {organizer?.name || 'TAQtix Official'}
              </p>
              <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                Penyelenggara Acara
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
