'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  targetUrl?: string | null;
  position?: string;
  order?: number;
  isActive?: boolean;
}

export const DEFAULT_HOME_BANNERS: BannerItem[] = [
  {
    id: 'bnr-1',
    title: 'Jakarta Live Fest 2026',
    subtitle: 'Konser Spektakuler Musisi Terkemuka & Kolaborasi Lintas Genre',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&h=650&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-2',
    title: 'Indonesia Creative & Culinary Expo 2026',
    subtitle: 'Festival Kuliner Nusantara & Eksibisi Industri Kreatif Terbesar',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&h=650&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-3',
    title: 'Spiritual Return to Origin 2026',
    subtitle: 'Special Orchestral Performance & Immersive Visual Show',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&h=650&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-4',
    title: 'Tawa Nusantara: Stand-Up Comedy Tour',
    subtitle: 'Tur Komedi Spesial Bersama Komika Ternama Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&h=650&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-5',
    title: 'Jakarta Creative Workshop & Visual Art Expo',
    subtitle: 'Eksplorasi Kaligrafi Modern, Fotografi & Desain Visual',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&h=650&q=85',
    targetUrl: '/events',
  },
];

interface HeroBannerCarouselProps {
  banners?: BannerItem[];
}

export function HeroBannerCarousel({ banners = [] }: HeroBannerCarouselProps) {
  const router = useRouter();
  const rawList = banners && banners.length > 0 ? banners : DEFAULT_HOME_BANNERS;

  // Pastikan list memiliki minimal 4 item untuk rotasi coverflow 3D yang mulus tanpa tabrakan indeks
  const displayList: BannerItem[] =
    rawList.length === 1
      ? rawList
      : rawList.length < 4
      ? [...rawList, ...rawList]
      : rawList;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = displayList.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  // Auto-play berotasi otomatis setiap 5.5 detik (terjeda saat mouse di-hover)
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  // Dukungan Swipe Touch untuk Smartphone / Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  // Menghitung offset posisi relatif untuk efek coverflow peeking
  const getOffset = (idx: number) => {
    let diff = (idx - activeIndex) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <div
      className="relative w-full max-w-7xl mx-auto py-2 sm:py-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Coverflow Stage Area */}
      <div className="relative w-full h-[220px] sm:h-[300px] md:h-[380px] lg:h-[430px] overflow-hidden flex items-center justify-center">
        {displayList.map((banner, idx) => {
          const d = getOffset(idx);
          const isActive = d === 0;
          const isPrev = d === -1;
          const isNext = d === 1;

          // Hitung style transformasi coverflow peeking seperti Artatix
          let transformStyle: React.CSSProperties = {};
          let cardClasses = '';

          if (isActive) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(1) translateX(0%)',
              zIndex: 20,
              opacity: 1,
            };
            cardClasses = 'shadow-[0_22px_50px_-12px_rgba(8,173,174,0.22),0_12px_30px_-8px_rgba(0,0,0,0.15)] ring-1 ring-black/5';
          } else if (isPrev) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(0.91) translateX(-84%)',
              zIndex: 10,
              opacity: 0.65,
            };
            cardClasses = 'shadow-lg hover:opacity-90 transition-opacity cursor-pointer';
          } else if (isNext) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(0.91) translateX(84%)',
              zIndex: 10,
              opacity: 0.65,
            };
            cardClasses = 'shadow-lg hover:opacity-90 transition-opacity cursor-pointer';
          } else {
            transformStyle = {
              transform: `translate(-50%, -50%) scale(0.75) translateX(${d > 0 ? 170 : -170}%)`,
              zIndex: 1,
              opacity: 0,
              pointerEvents: 'none',
            };
          }

          return (
            <div
              key={`${banner.id}-${idx}`}
              style={transformStyle}
              onClick={() => {
                if (isActive) {
                  if (banner.targetUrl) router.push(banner.targetUrl);
                } else if (isPrev) {
                  handlePrev();
                } else if (isNext) {
                  handleNext();
                }
              }}
              className={cn(
                'absolute top-1/2 left-1/2 w-[88%] sm:w-[82%] md:w-[76%] lg:w-[72%] max-w-5xl h-full rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 ease-out bg-slate-900 group',
                cardClasses
              )}
            >
              {/* Full-bleed Banner Graphic / Poster */}
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className={cn(
                  'w-full h-full object-cover object-center filter contrast-105 transition-transform duration-700 ease-out',
                  isActive ? 'group-hover:scale-[1.02]' : 'brightness-90'
                )}
                loading="eager"
              />

              {/* Overlay gelap bertingkat untuk teks readable */}
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-300',
                  isActive
                    ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent'
                    : 'bg-slate-950/40 hover:bg-slate-950/20'
                )}
              />

              {/* Konten Banner (Tampil menawan pada active card) */}
              {isActive && (
                <div className="absolute inset-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between text-white z-10 pointer-events-none">
                  {/* Top Tag */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#08ADAE]" />
                      <span>Official Promo TAQtix</span>
                    </span>
                  </div>

                  {/* Bottom Content & CTA */}
                  <div className="space-y-2 sm:space-y-3 max-w-2xl">
                    <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 sm:line-clamp-2 drop-shadow-xs max-w-xl">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="pt-1.5 flex items-center gap-3 pointer-events-auto">
                      <Link
                        href={banner.targetUrl || '/events'}
                        className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-[#08ADAE] hover:bg-[#079b9c] text-white rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-[#08ADAE]/30 transition-transform active:scale-95 cursor-pointer"
                      >
                        <span>Lihat Detail Event</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Circular Navigation Arrows (Artatix Border-Anchored Style) */}
        {total > 1 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] sm:w-[82%] md:w-[76%] lg:w-[72%] max-w-5xl pointer-events-none z-30 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="pointer-events-auto -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.18)] border border-slate-100 flex items-center justify-center hover:bg-[#08ADAE] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="pointer-events-auto translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.18)] border border-slate-100 flex items-center justify-center hover:bg-[#08ADAE] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Pagination Indicators (Artatix Style: Active is elongated Pill, others are dots) */}
      {rawList.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5">
          {rawList.map((_, idx) => {
            const isDotActive = activeIndex % rawList.length === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'transition-all duration-300 cursor-pointer',
                  isDotActive
                    ? 'w-7 sm:w-8 h-2 sm:h-2.5 rounded-full bg-[#08ADAE] shadow-sm'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-300 hover:bg-slate-400'
                )}
                aria-label={`Pindah ke banner ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
