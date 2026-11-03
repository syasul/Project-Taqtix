'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Calendar,
  MapPin,
  QrCode,
  ExternalLink,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  X,
  Share2,
  Filter,
} from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface UnifiedTicket {
  ticketId: string;
  ticketStatus: 'VALID' | 'CHECKED_IN' | 'CANCELLED' | string;
  ticketCategory: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  orderId?: string;
  orderDate?: string;
  totalAmount?: number;
  eventTitle: string;
  eventLocation?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  isDateTba?: boolean;
  organizerName?: string;
  signedQrPayload?: string;
}

export default function AllTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UnifiedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedQrTicket, setSelectedQrTicket] = useState<UnifiedTicket | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState<string>('');

  // 1. Initial Load: Auto-fetch from user login or localStorage
  useEffect(() => {
    const loadInitialTickets = async () => {
      setIsLoading(true);
      try {
        // Jika user sudah login, prioritaskan tiket user
        if (user) {
          try {
            const res = await apiClient.get('/tickets/my');
            const data = res.data?.data || [];
            if (Array.isArray(data) && data.length > 0) {
              const mapped: UnifiedTicket[] = data.map((t: any) => ({
                ticketId: t.id,
                ticketStatus: t.status,
                ticketCategory: t.orderItem?.ticketCategory?.name || 'Reguler',
                buyerName: t.attendeeName || t.orderItem?.attendeeName || t.orderItem?.order?.buyerName || 'Pemegang Tiket',
                buyerEmail: t.orderItem?.attendeeEmail || t.orderItem?.order?.buyerEmail,
                buyerPhone: t.orderItem?.attendeePhone || t.orderItem?.order?.buyerPhone,
                orderId: t.orderItem?.orderId,
                orderDate: t.createdAt,
                eventTitle: t.event?.title || 'Event TAQtix',
                eventLocation: t.event?.location || 'Lokasi Belum Ditentukan',
                eventStartDate: t.event?.startDate,
                eventEndDate: t.event?.endDate,
                isDateTba: t.event?.isDateTba || t.isDateTba,
                signedQrPayload: t.qrPayload || t.id,
              }));
              setTickets(mapped);
              setIsLoading(false);
              return;
            }
          } catch {
            // Lanjut ke fallback jika /tickets/my tidak berhasil
          }
        }

        // Cek localStorage apakah ada transaksi terakhir di browser ini
        let savedOrderId = '';
        try {
          const raw = localStorage.getItem('taqtix_recent_order');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.orderId) {
              savedOrderId = parsed.orderId;
            }
          }
        } catch {}

        if (savedOrderId) {
          const res = await apiClient.get('/tickets/lookup', {
            params: { q: savedOrderId },
          });
          const lookupData = res.data?.data || [];
          if (Array.isArray(lookupData) && lookupData.length > 0) {
            setTickets(lookupData);
            setSearchedKeyword(`Pesanan Terakhir (${savedOrderId.slice(0, 8)}...)`);
          }
        }
      } catch {
        // Tidak ada tiket awal
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialTickets();
  }, [user]);

  // 2. Manual Search by Phone / Email / Order ID
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q || q.length < 3) {
      toast.error('Masukkan nomor WhatsApp, Email, atau ID Pesanan minimal 3 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.get('/tickets/lookup', {
        params: { q },
      });
      const data: UnifiedTicket[] = res.data?.data || [];
      setTickets(data);
      setSearchedKeyword(q);
      if (data.length === 0) {
        toast.info('Tidak ada tiket yang ditemukan untuk pencarian ini.');
      } else {
        toast.success(`Ditemukan ${data.length} tiket resmi!`);
      }
    } catch (err: any) {
      setTickets([]);
      toast.error(err.response?.data?.message || 'Gagal mencari tiket. Silakan periksa kembali kata kunci Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend Ticket via WhatsApp / Email
  const handleResend = async (ticketId: string) => {
    setResendingId(ticketId);
    try {
      const res = await apiClient.post(`/tickets/${ticketId}/resend`);
      toast.success(res.data?.data?.message || 'E-ticket berhasil dikirimkan ulang ke WhatsApp & Email pembeli!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang tiket.');
    } finally {
      setResendingId(null);
    }
  };

  // 4. Copy Direct Link
  const handleCopyLink = (ticketId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/e-ticket/${ticketId}`;
      navigator.clipboard.writeText(url);
      toast.success('Tautan E-Ticket berhasil disalin ke clipboard!');
    }
  };

  // Filter tickets by upcoming / past
  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'all') return true;
    if (t.isDateTba) {
      if (activeFilter === 'upcoming') return true;
      if (activeFilter === 'past') return t.ticketStatus === 'CHECKED_IN';
      return true;
    }
    if (!t.eventStartDate) return true;
    try {
      const start = new Date(t.eventStartDate);
      if (activeFilter === 'upcoming') {
        return !isPast(start) || t.ticketStatus === 'VALID';
      }
      if (activeFilter === 'past') {
        return isPast(start) && t.ticketStatus === 'CHECKED_IN';
      }
    } catch {
      return true;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner (Astro Cosmic Glass) */}
      <div className="relative overflow-hidden rounded-3xl astro-glass border border-white/10 p-6 sm:p-10 text-white shadow-2xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#060913]">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#08ADAE]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#00F0FF] bg-[#08ADAE]/15 border border-[#08ADAE]/30 astro-glass-pill">
            <Ticket className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Pusat Tiket Resmi TAQtix</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Semua Tiket Saya
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Kelola, tampilkan barcode e-ticket untuk scan pintu masuk, atau kirimkan ulang tiket Anda langsung ke WhatsApp & Email kapan saja.
          </p>
        </div>

        {/* Quick Search Form inside Banner */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari via No WhatsApp (08...), Email, atau Order ID..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00F0FF] transition"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-xl shrink-0 cursor-pointer shadow-[0_0_20px_rgba(8,173,174,0.4)] transition"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4" />
                  <span>Cari Tiket</span>
                </span>
              )}
            </Button>
          </form>
          {searchedKeyword && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>Menampilkan tiket untuk:</span>
              <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md">
                {searchedKeyword}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchedKeyword('');
                  setSearchQuery('');
                }}
                className="text-[#00F0FF] hover:underline cursor-pointer ml-1"
              >
                Reset
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-1.5 astro-glass p-1 rounded-2xl border border-white/10 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:text-white border-transparent'
            }`}
          >
            Semua ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
              activeFilter === 'upcoming'
                ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:text-white border-transparent'
            }`}
          >
            Mendatang
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('past')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
              activeFilter === 'past'
                ? 'bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] text-slate-950 font-bold border-transparent shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:text-white border-transparent'
            }`}
          >
            Selesai / Digunakan
          </button>
        </div>

        {!user && (
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Punya akun TAQtix?</span>
            <Link
              href="/login?redirect=/tickets"
              className="text-[#00F0FF] font-bold hover:underline"
            >
              Masuk untuk sinkronisasi otomatis &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="astro-card rounded-3xl p-6 border border-white/10 shadow-xs animate-pulse space-y-4 bg-slate-900/60"
            >
              <div className="h-6 bg-slate-800 rounded-md w-3/4" />
              <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
              <div className="h-24 bg-slate-800/60 rounded-2xl" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTickets.length === 0 && (
        <div className="text-center py-16 px-4 astro-glass rounded-3xl border border-white/10 shadow-2xl max-w-lg mx-auto space-y-5 bg-slate-900/60">
          <div className="w-16 h-16 rounded-2xl bg-[#08ADAE]/15 text-[#00F0FF] border border-[#08ADAE]/30 mx-auto flex items-center justify-center">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Belum Ada Tiket yang Ditampilkan</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Jika Anda baru saja memesan tiket, silakan cari menggunakan <strong>Nomor WhatsApp</strong> atau <strong>Email</strong> yang Anda gunakan saat checkout pada kolom pencarian di atas.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] hover:brightness-110 text-slate-950 font-bold rounded-xl cursor-pointer">
                Jelajahi Event Seru
              </Button>
            </Link>
            {!user && (
              <Link href="/login?redirect=/tickets" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-white/10 astro-glass text-white rounded-xl cursor-pointer">
                  Masuk ke Akun
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Tickets Grid */}
      {!isLoading && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTickets.map((ticket) => {
            const isTicketValid = ticket.ticketStatus === 'VALID';
            const isTicketCheckedIn = ticket.ticketStatus === 'CHECKED_IN';

            return (
              <div
                key={ticket.ticketId}
                className="group relative astro-card rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl hover:border-[#00F0FF]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Perforated Decorative Line on Top */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#A855F7]" />

                <div className="p-6 space-y-5">
                  {/* Event & Category Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
                        {ticket.ticketCategory}
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-[#00F0FF] transition-colors leading-snug line-clamp-2">
                        {ticket.eventTitle}
                      </h3>
                      {ticket.organizerName && (
                        <p className="text-xs text-slate-400">Oleh: {ticket.organizerName}</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isTicketValid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Siap Digunakan
                        </span>
                      ) : isTicketCheckedIn ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/40 text-blue-400 border border-blue-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sudah Check-In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/40 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {ticket.ticketStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className={cn('w-4 h-4 shrink-0', ticket.isDateTba ? 'text-amber-400' : 'text-[#00F0FF]')} />
                      <span className={cn('truncate', ticket.isDateTba && 'text-amber-400 font-semibold')}>
                        {ticket.isDateTba
                          ? 'Waktu & Tanggal TBA'
                          : ticket.eventStartDate
                          ? format(new Date(ticket.eventStartDate), 'EEEE, dd MMM yyyy', { locale: localeId })
                          : 'Tanggal TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00F0FF] shrink-0" />
                      <span className="truncate" title={ticket.eventLocation}>
                        {ticket.eventLocation || 'Lokasi TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold text-white">
                        {ticket.buyerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-400 truncate">
                        ID: {ticket.ticketId.slice(0, 10)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perforated Coupon Cut Divider */}
                <div className="relative flex items-center px-4">
                  <div className="absolute left-0 -translate-x-1/2 w-5 h-5 rounded-full bg-[#060913] border-r border-white/10" />
                  <div className="w-full border-t-2 border-dashed border-white/10" />
                  <div className="absolute right-0 translate-x-1/2 w-5 h-5 rounded-full bg-[#060913] border-l border-white/10" />
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-4 sm:p-6 bg-slate-950/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Tombol QR Code Pop-up */}
                    <Button
                      type="button"
                      onClick={() => setSelectedQrTicket(ticket)}
                      className="bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] hover:brightness-110 text-slate-950 font-bold rounded-xl text-xs px-3.5 py-2 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(8,173,174,0.35)]"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Buka QR Scan</span>
                    </Button>

                    {/* Tombol Halaman Tiket Penuh */}
                    <Link href={`/e-ticket/${ticket.ticketId}`}>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 astro-glass hover:bg-white/10 text-slate-200 font-semibold rounded-xl text-xs px-3 py-2 cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Kirim Ulang ke WA */}
                    <button
                      type="button"
                      title="Kirim ulang tiket ke WhatsApp & Email"
                      disabled={resendingId === ticket.ticketId}
                      onClick={() => handleResend(ticket.ticketId)}
                      className="p-2 text-slate-400 hover:text-[#00F0FF] hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition cursor-pointer"
                    >
                      {resendingId === ticket.ticketId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      title="Salin tautan tiket"
                      onClick={() => handleCopyLink(ticket.ticketId)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INTERAKTIF: POPUP QR CODE UNTUK GATE SCAN */}
      {selectedQrTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm astro-glass rounded-3xl p-6 shadow-2xl border border-white/15 space-y-6 text-center animate-in zoom-in-95 duration-200 bg-slate-950/95">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedQrTicket(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                {selectedQrTicket.ticketCategory}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {selectedQrTicket.eventTitle}
              </h3>
              <p className="text-xs text-slate-400">Nama: {selectedQrTicket.buyerName}</p>
            </div>

            {/* QR Code Container with Frame */}
            <div className="relative p-6 bg-white rounded-2xl border border-white/20 inline-block mx-auto shadow-2xl">
              <QRCodeSVG
                value={selectedQrTicket.signedQrPayload || selectedQrTicket.ticketId}
                size={220}
                level="H"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52 mx-auto"
              />
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>QR Resmi Anti-Pemalsuan</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Tunjukkan QR Code ini di gerbang tiket (gate check-in) untuk di-scan oleh petugas resmi acara.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Link href={`/e-ticket/${selectedQrTicket.ticketId}`} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] hover:brightness-110 text-slate-950 font-black rounded-xl cursor-pointer text-xs py-2.5">
                  Buka E-Ticket Lengkap
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => handleCopyLink(selectedQrTicket.ticketId)}
                className="border-white/15 astro-glass text-slate-200 rounded-xl cursor-pointer text-xs py-2.5"
              >
                Salin Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
