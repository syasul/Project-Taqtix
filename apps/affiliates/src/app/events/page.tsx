'use client';

import React, { useState } from 'react';
import {
  TicketPercent,
  Sparkles,
  Edit2,
  Copy,
  Check,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  Info,
} from 'lucide-react';
import { initialAffiliateEvents, AffiliateEventPromo } from '@/lib/data';
import { toast } from 'sonner';

export default function AffiliateEventsPage() {
  const [events, setEvents] = useState<AffiliateEventPromo[]>(initialAffiliateEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customizingEvent, setCustomizingEvent] = useState<AffiliateEventPromo | null>(null);
  const [customCodeInput, setCustomCodeInput] = useState('');

  const filteredEvents = events.filter(
    (e) =>
      e.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.promoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = (eventSlug: string, promoCode: string, id: string) => {
    const url = `https://taqtix.id/events/${eventSlug}?aff=${promoCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(`Tautan referral ${promoCode} berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGenerateRandomCode = (eventTitle: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanPrefix = eventTitle.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const generated = `SYAM-${cleanPrefix}${rand}`;
    setCustomCodeInput(generated);
    toast.success('Kode promo acak unik berhasil digenerate!');
  };

  const handleSaveCustomCode = () => {
    if (!customizingEvent || !customCodeInput.trim()) return;
    const updated = events.map((e) => {
      if (e.id === customizingEvent.id) {
        return {
          ...e,
          promoCode: customCodeInput.trim().toUpperCase(),
        };
      }
      return e;
    });
    setEvents(updated);
    toast.success(`Kode promo untuk ${customizingEvent.eventTitle} berhasil diubah menjadi ${customCodeInput.trim().toUpperCase()}`);
    setCustomizingEvent(null);
    setCustomCodeInput('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TicketPercent className="w-6 h-6 text-[#08B4B5]" />
            Kelola Kode Promo & Event
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Anda dapat menentukan kode promo berbeda di tiap event (bikin kode kustom sendiri atau generate otomatis) dengan potongan harga yang disediakan oleh penyelenggara.
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
        <Info className="w-5 h-5 text-[#08B4B5] shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block">Satu Akun, Kode Unik Berbeda Tiap Event</strong>
          Setiap kali pembeli checkout tiket menggunakan kode promo atau tautan Anda, pembeli otomatis mendapatkan diskon resmi dan akun Anda akan tercatat sebagai affiliator yang berhasil menjual tiket tersebut.
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari event, kode promo, atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition"
          />
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#08B4B5]" />
                  {new Date(evt.eventDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' • '}
                  <MapPin className="w-3.5 h-3.5 text-[#08B4B5] ml-1" />
                  {evt.eventLocation}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{evt.eventTitle}</h3>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto self-start md:self-auto">
                <button
                  onClick={() => {
                    setCustomizingEvent(evt);
                    setCustomCodeInput(evt.promoCode);
                  }}
                  className="w-full min-[420px]:w-auto justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah / Generate Kode</span>
                </button>

                <button
                  onClick={() => handleCopyLink(evt.eventSlug, evt.promoCode, evt.id)}
                  className="w-full min-[420px]:w-auto justify-center px-3.5 py-1.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedId === evt.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link Referral</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Promo Code & Rates Info */}
            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Kode Promo Event Ini
                </span>
                <span className="font-mono font-bold text-sm text-[#08B4B5] block mt-0.5">
                  {evt.promoCode}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Potongan Diskon untuk Pembeli
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {evt.discountType === 'percentage'
                    ? `${evt.discountValue}% OFF`
                    : `Rp ${evt.discountValue.toLocaleString('id-ID')} OFF`}
                </span>
                <span className="text-[10px] text-slate-400">Disediakan Penyelenggara</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Komisi Anda per Tiket
                </span>
                <span className="font-bold text-emerald-600 block mt-0.5">
                  {evt.commissionType === 'percentage'
                    ? `${evt.commissionValue}% dari omset`
                    : `Rp ${evt.commissionValue.toLocaleString('id-ID')} / tiket`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Performa Penggunaan
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {evt.buyersCount} Pembeli • {evt.ticketsSold} Tiket
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                  Komisi: Rp {evt.commissionEarned.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOMIZE OR GENERATE CODE MODAL (Requirement 8 & 9) */}
      {customizingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#08B4B5]" />
                  Ubah Kode Promo Event
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{customizingEvent.eventTitle}</p>
              </div>
              <button
                onClick={() => setCustomizingEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Kode Promo Anda</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomCode(customizingEvent.eventTitle)}
                    className="text-[#08B4B5] hover:text-[#079b9c] font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Otomatis</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customCodeInput}
                  onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: SYAMSUL2026"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-900 font-mono font-bold uppercase tracking-wider text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Kode ini khusus berlaku untuk event "{customizingEvent.eventTitle}". Pembeli yang memasukkan kode ini akan menerima potongan diskon{' '}
                  <strong className="text-slate-700">
                    {customizingEvent.discountType === 'percentage'
                      ? `${customizingEvent.discountValue}%`
                      : `Rp ${customizingEvent.discountValue.toLocaleString('id-ID')}`}
                  </strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomizingEvent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomCode}
                  className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan Kode Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
