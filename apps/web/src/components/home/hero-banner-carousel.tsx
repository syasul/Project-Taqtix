'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
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
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&h=640&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-2',
    title: 'Indonesia Creative & Culinary Expo 2026',
    subtitle: 'Festival Kuliner Nusantara & Eksibisi Industri Kreatif Terbesar',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&h=640&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-3',
    title: 'Spiritual Return to Origin 2026',
    subtitle: 'Special Orchestral Performance & Immersive Visual Show',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1920&h=640&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-4',
    title: 'Tawa Nusantara: Stand-Up Comedy Tour',
    subtitle: 'Tur Komedi Spesial Bersama Komika Ternama Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&h=640&q=85',
    targetUrl: '/events',
  },
  {
    id: 'bnr-5',
    title: 'Jakarta Creative Workshop & Visual Art Expo',
    subtitle: 'Eksplorasi Kaligrafi Modern, Fotografi & Desain Visual',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&h=640&q=85',
    targetUrl: '/events',
  },
];

interface HeroBannerCarouselProps {
  banners?: BannerItem[];
}

export function HeroBannerCarousel({ banners = [] }: HeroBannerCarouselProps) {
  const router = useRouter();
  const rawList = banners && banners.length > 0 ? banners : DEFAULT_HOME_BANNERS;

  // Pastikan list memiliki minimal 4 item untuk perputaran coverflow yang mulus
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

  // Rotasi otomatis setiap 5.5 detik (terjeda saat mouse hover)
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  // Touch Swipe untuk Mobile & Tablet
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

  // Menghitung offset relatif
  const getOffset = (idx: number) => {
    let diff = (idx - activeIndex) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const currentRawIndex = activeIndex % rawList.length;

  return (
    <div
      className="relative w-full max-w-[1400px] mx-auto py-2 sm:py-3 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Lighting Glow di belakang banner aktif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%] bg-gradient-to-r from-[#08ADAE]/15 via-teal-300/10 to-[#08ADAE]/15 rounded-3xl blur-3xl pointer-events-none -z-10" />

      {/* Panoramic Widescreen Stage Area */}
      <div className="relative w-full h-[220px] sm:h-[300px] md:h-[370px] lg:h-[420px] overflow-hidden flex items-center justify-center">
        {displayList.map((banner, idx) => {
          const d = getOffset(idx);
          const isActive = d === 0;
          const isPrev = d === -1;
          const isNext = d === 1;

          // Transformasi presisi: Lebar 94% (widescreen), peek samping 3-4% yang halus dan rapi
          let transformStyle: React.CSSProperties = {};
          let cardClasses = '';

          if (isActive) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(1) translateX(0%)',
              zIndex: 20,
              opacity: 1,
            };
            cardClasses =
              'shadow-[0_20px_50px_-15px_rgba(8,173,174,0.2),0_10px_25px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08]';
          } else if (isPrev) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(0.96) translateX(-97%)',
              zIndex: 10,
              opacity: 0.45,
            };
            cardClasses = 'shadow-md hover:opacity-75 transition-opacity cursor-pointer';
          } else if (isNext) {
            transformStyle = {
              transform: 'translate(-50%, -50%) scale(0.96) translateX(97%)',
              zIndex: 10,
              opacity: 0.45,
            };
            cardClasses = 'shadow-md hover:opacity-75 transition-opacity cursor-pointer';
          } else {
            transformStyle = {
              transform: `translate(-50%, -50%) scale(0.85) translateX(${d > 0 ? 180 : -180}%)`,
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
                'absolute top-1/2 left-1/2 w-[92%] sm:w-[94%] md:w-[95%] max-w-[1340px] h-full rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-600 ease-out bg-slate-950 group',
                cardClasses
              )}
            >
              {/* Gambar Banner Utama - Tajam & Widescreen */}
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className={cn(
                  'w-full h-full object-cover object-center filter contrast-105 transition-transform duration-700 ease-out',
                  isActive ? 'group-hover:scale-[1.015]' : 'brightness-90'
                )}
                loading="eager"
              />

              {/* Gradient halus di dasar banner untuk keterbacaan teks tanpa menutup karya poster */}
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-300',
                  isActive
                    ? 'bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent'
                    : 'bg-slate-950/40 hover:bg-slate-950/20'
                )}
              />

              {/* Konten Bersih & Elegan di Dasar Banner (Hanya pada Active Card) */}
              {isActive && (
                <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-end text-white z-10 pointer-events-none">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
                        <Sparkles className="w-3 h-3 text-[#08ADAE]" />
                        <span>Promo Spesial TAQtix</span>
                      </span>

                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
                        {banner.title}
                      </h3>

                      {banner.subtitle && (
                        <p className="text-xs sm:text-sm text-slate-200/90 font-medium line-clamp-1 drop-shadow-xs max-w-xl">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 pointer-events-auto">
                      <Link
                        href={banner.targetUrl || '/events'}
                        className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-white text-slate-900 hover:bg-[#08ADAE] hover:text-white font-bold text-xs sm:text-sm shadow-xl transition-all duration-200 active:scale-95 group/btn cursor-pointer"
                      >
                        <span>Lihat Detail Event</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Liquid Glass Navigation Arrows (Tucked Neatly Inside Active Bounds) */}
        {total > 1 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[94%] md:w-[95%] max-w-[1340px] pointer-events-none z-30 flex items-center justify-between px-3 sm:px-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 hover:bg-[#08ADAE] text-slate-800 hover:text-white backdrop-blur-xl border border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.14)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 hover:bg-[#08ADAE] text-slate-800 hover:text-white backdrop-blur-xl border border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.14)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Signature TAQtix Segmented Progress Deck (Bukan Dot Biasa) */}
      {rawList.length > 1 && (
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 mt-4 sm:mt-5">
          {/* Slide Counter */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500">
            <span className="text-[#08ADAE]">0{currentRawIndex + 1}</span>
            <span className="text-slate-300">/</span>
            <span>0{rawList.length}</span>
          </div>

          {/* Segmented Timeline Bars */}
          <div className="flex items-center gap-2 flex-1 mx-4">
            {rawList.map((item, idx) => {
              const isSegmentActive = currentRawIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className="group relative flex-1 h-1.5 sm:h-2 rounded-full bg-slate-200/90 overflow-hidden cursor-pointer transition-all hover:h-2.5"
                  title={item.title}
                  aria-label={`Lihat banner ${item.title}`}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isSegmentActive
                        ? 'w-full bg-[#08ADAE] shadow-[0_0_8px_rgba(8,173,174,0.6)]'
                        : 'w-0 bg-transparent group-hover:w-full group-hover:bg-slate-300'
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Micro Status Label */}
          <div className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Featured</span>
          </div>
        </div>
      )}
    </div>
  );
}
