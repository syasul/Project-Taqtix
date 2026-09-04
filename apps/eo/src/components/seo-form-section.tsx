'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Globe,
  Tag,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
} from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SeoFormSectionProps {
  form: UseFormReturn<any>;
  currentTitle?: string;
  currentDescription?: string;
  eventSlug?: string;
}

const QUICK_KEYWORD_SUGGESTIONS = [
  'Tiket Resmi',
  'Festival 2026',
  'Konser Musik',
  'Jakarta Event',
  'Promo Tiket',
  'Early Bird',
  'Kajian Akbar',
  'Halal Expo',
];

export default function SeoFormSection({
  form,
  currentTitle = '',
  currentDescription = '',
  eventSlug = 'nama-event-anda',
}: SeoFormSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Watch SEO fields
  const seoTitle = form.watch('seoTitle') || '';
  const seoDescription = form.watch('seoDescription') || '';
  const seoKeywords = form.watch('seoKeywords') || '';

  // Calculate SERP preview values
  const previewTitle = seoTitle.trim() || currentTitle.trim() || 'Judul Event Anda di Sini';
  const previewDescription =
    seoDescription.trim() ||
    (currentDescription.trim().length > 150
      ? currentDescription.trim().slice(0, 150) + '...'
      : currentDescription.trim()) ||
    'Beli tiket resmi event ini dengan mudah dan aman di platform Taqtix. Temukan info jadwal, lineup, dan diskon promo...';

  // Keyword list
  const currentKeywordList = seoKeywords
    ? seoKeywords
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0)
    : [];

  const handleAddSuggestedKeyword = (kw: string) => {
    if (currentKeywordList.includes(kw)) return;
    const updated = [...currentKeywordList, kw].join(', ');
    form.setValue('seoKeywords', updated, { shouldDirty: true });
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const updated = currentKeywordList.filter((k: string) => k !== kwToRemove).join(', ');
    form.setValue('seoKeywords', updated, { shouldDirty: true });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 via-white to-teal-50/40 hover:bg-slate-50 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#08B4B5]/10 text-[#08B4B5] flex items-center justify-center font-bold shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Pengaturan SEO & Kata Kunci Pencarian
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/30">
                <Zap className="w-3 h-3 text-[#08B4B5]" />
                <span>Double Engagement Engine</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Optimalkan visibilitas event di Google search dan mesin pencari platform TAQtix.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-lg text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-6 border-t border-slate-100 space-y-6">
          {/* Double Engagement Explanation Banner */}
          <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#08B4B5] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">
                Cara Kerja Double Engagement SEO Taqtix:
              </strong>
              <p className="text-[11px] text-teal-900 leading-relaxed">
                Kata kunci (keywords) yang Anda masukkan di bawah akan otomatis{' '}
                <strong>dikolaborasikan dan didorong (boost)</strong> oleh tim Main Admin Taqtix dengan platform keywords resmi (contoh: kategori trending, tiket resmi, promo kota). Hasilnya, indeks pencarian event Anda memiliki jangkauan dua arah (*double engagement*) di Google dan sosial media.
              </p>
            </div>
          </div>

          {/* SEO Keywords Input */}
          <FormField
            control={form.control}
            name="seoKeywords"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#08B4B5]" />
                    <span>Kata Kunci / Target Search Keywords (Pisahkan dengan koma)</span>
                  </FormLabel>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentKeywordList.length} Kata Kunci Aktif
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Contoh: konser musik jakarta, festival islam 2026, tiket taqwa movement, early bird"
                    className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs"
                    {...field}
                  />
                </FormControl>

                {/* Tag Pills Display */}
                {currentKeywordList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentKeywordList.map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50/80 text-[#08B4B5] border border-teal-200 text-[11px] font-medium"
                      >
                        <span>#{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Quick Tags */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">
                    Rekomendasi Kata Kunci Cepat (Klik untuk menambah):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_KEYWORD_SUGGESTIONS.map((kw) => {
                      const isAdded = currentKeywordList.includes(kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddSuggestedKeyword(kw)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300'
                          }`}
                        >
                          <span>{isAdded ? '✓' : '+'}</span>
                          <span>{kw}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <FormMessage className="text-rose-500 text-xs" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom SEO Meta Title */}
            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Judul Meta SEO (Google Title)
                    </FormLabel>
                    <span className="text-[10px] text-slate-400">
                      {(field.value || '').length}/60 Karakter
                    </span>
                  </div>
                  <FormControl>
                    <Input
                      placeholder={currentTitle || 'Default mengikuti Judul Event'}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[10px] text-slate-400">
                    Kosongkan jika ingin memakai judul event utama secara otomatis.
                  </p>
                  <FormMessage className="text-rose-500 text-xs" />
                </FormItem>
              )}
            />

            {/* Custom SEO Meta Description */}
            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Deskripsi Meta SEO (Snippet)
                    </FormLabel>
                    <span className="text-[10px] text-slate-400">
                      {(field.value || '').length}/160 Karakter
                    </span>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Ringkasan padat acara untuk preview link WhatsApp / Google..."
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:border-[#08B4B5] focus:bg-white rounded-xl text-xs"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[10px] text-slate-400">
                    Muncul di bawah judul saat orang mencari event Anda di Google.
                  </p>
                  <FormMessage className="text-rose-500 text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Live SERP Google Search Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-b border-slate-200/60 pb-2">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#08B4B5]" />
                <span>Pratinjau Hasil Pencarian Google (SERP Preview)</span>
              </span>
              <span className="text-slate-400 font-normal">Real-time simulator</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 font-sans">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <div className="w-4 h-4 rounded-full bg-[#08B4B5] text-white flex items-center justify-center font-bold text-[8px]">
                  T
                </div>
                <span className="text-slate-800 font-semibold">Taqtix Event Hub</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-mono truncate text-[10px]">
                  https://taqtix.id/events/{eventSlug}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
                {previewTitle} | Tiket Resmi & Jadwal di TAQtix
              </h4>

              <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {previewDescription}
              </p>

              {currentKeywordList.length > 0 && (
                <div className="pt-2 flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="font-bold text-slate-500">Target Tags:</span>
                  <span className="italic text-teal-700 truncate">
                    {currentKeywordList.slice(0, 4).map((k: string) => `#${k}`).join(' ')}
                    {currentKeywordList.length > 4 ? ` (+${currentKeywordList.length - 4} lainnya)` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
