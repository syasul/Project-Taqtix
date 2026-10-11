'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Ticket,
  Calendar,
  MapPin,
  ExternalLink,
  MessageSquare,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  QrCode,
  Loader2,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface LookedUpTicket {
  ticketId: string;
  ticketStatus: 'VALID' | 'CHECKED_IN' | 'CANCELLED';
  ticketCategory: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  eventTitle: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  organizerName: string;
  signedQrPayload: string;
}

interface StoredOrder {
  orderId: string;
  eventId?: string;
  timestamp: number;
}

export default function CheckTicketPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [tickets, setTickets] = useState<LookedUpTicket[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [recentOrder, setRecentOrder] = useState<StoredOrder | null>(null);

  // Check localStorage for recent order
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taqtix_recent_order');
      if (stored) {
        const parsed: StoredOrder = JSON.parse(stored);
        // Valid for up to 7 days
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setRecentOrder(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSearch = async (searchVal?: string) => {
    const val = (searchVal !== undefined ? searchVal : query).trim();
    if (!val || val.length < 3) {
      toast.error('Masukkan nomor WhatsApp, Email, atau ID Pesanan minimal 3 karakter.');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await apiClient.get('/tickets/lookup', {
        params: { q: val },
      });
      const data: LookedUpTicket[] = res.data?.data || [];
      setTickets(data);
      if (data.length === 0) {
        toast.info('Tidak ada tiket yang cocok dengan kata kunci tersebut.');
      } else {
        toast.success(`Ditemukan ${data.length} tiket!`);
      }
    } catch (err: any) {
      setTickets([]);
      toast.error(err.response?.data?.message || 'Gagal mencari tiket. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseRecentOrder = () => {
    if (recentOrder?.orderId) {
      setQuery(recentOrder.orderId);
      handleSearch(recentOrder.orderId);
    }
  };

  const handleResend = async (ticketId: string) => {
    setResendingId(ticketId);
    try {
      const res = await apiClient.post(`/tickets/${ticketId}/resend`);
      toast.success(res.data?.data?.message || 'E-ticket berhasil dikirimkan ulang ke WhatsApp & Email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang tiket.');
    } finally {
      setResendingId(null);
    }
  };

  const copyTicketLink = (ticketId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/e-ticket/${ticketId}`;
      navigator.clipboard.writeText(url);
      toast.success('Tautan E-Ticket berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#08ADAE] bg-[#08ADAE]/10 border border-[#08ADAE]/20">
          <QrCode className="w-3.5 h-3.5" />
          <span>Pusat Pencarian E-Ticket</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Cari & Cek Tiket Saya
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
          Pernah beli tiket tanpa login atau browser sempat tertutup? Cukup masukkan <strong>Nomor WhatsApp</strong>, <strong>Email</strong>, atau <strong>ID Pesanan</strong> untuk melihat e-ticket ber-QR Code Anda.
        </p>
      </div>

      {/* Recent Local Order Shortcut Notice */}
      {recentOrder && (
        <div className="liquid-glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#08ADAE]/30 shadow-sm bg-[#08ADAE]/5">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-[#08ADAE]/10 text-[#08ADAE] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Ditemukan Transaksi Terakhir di Perangkat Ini
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                ID Pesanan: {recentOrder.orderId}
              </p>
            </div>
          </div>
          <button
            onClick={handleUseRecentOrder}
            className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#08ADAE] hover:bg-[#07999A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            <span>Cek Tiket Ini Langsung</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unified Search Dock */}
      <div className="w-full max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="liquid-glass-pill p-2 rounded-2xl sm:rounded-full shadow-lg flex flex-col sm:flex-row items-center gap-2 border border-white/90"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 w-full flex-1">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Masukkan No. WhatsApp / Email / ID Pesanan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#08ADAE] hover:bg-[#07999A] text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_4px_14px_rgba(8,173,174,0.35)] disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <span>Cari Tiket</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results Section */}
      {hasSearched && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Hasil Pencarian ({tickets.length} Tiket Ditemukan)
            </h2>
            <span className="text-[11px] text-slate-500">
              Kata kunci: <span className="font-semibold text-slate-700">{query}</span>
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-white/80">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Tidak Ada Tiket yang Cocok
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Pastikan nomor WhatsApp atau Email sama persis dengan yang Anda masukkan saat formulir checkout. Jika baru saja transfer, mohon tunggu 1-2 menit agar sistem perbankan selesai memverifikasi pembayaran.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <a
                  href="https://wa.me/628158006658"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#08ADAE]" />
                  <span>Bantuan CS WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => {
                const isValid = t.ticketStatus === 'VALID';
                const isCheckedIn = t.ticketStatus === 'CHECKED_IN';
                const isResending = resendingId === t.ticketId;

                return (
                  <Card
                    key={t.ticketId}
                    className="liquid-glass-card rounded-2xl p-5 border border-white/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Status & Category Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#08ADAE] bg-[#08ADAE]/10 px-2.5 py-0.5 rounded-full border border-[#08ADAE]/20">
                          {t.ticketCategory}
                        </span>

                        {isValid && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Tiket Aktif
                          </span>
                        )}
                        {isCheckedIn && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            Sudah Check-in
                          </span>
                        )}
                        {!isValid && !isCheckedIn && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            Dibatalkan
                          </span>
                        )}
                      </div>

                      {/* Event Details */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {t.organizerName}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                          {t.eventTitle}
                        </h3>
                      </div>

                      {/* Buyer Details */}
                      <div className="p-3 rounded-xl bg-slate-50/70 space-y-1 text-xs text-slate-600 border border-slate-100">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Nama Pengunjung:</span>
                          <span className="font-bold text-slate-800">{t.buyerName}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">No. WhatsApp:</span>
                          <span className="font-mono text-slate-700">{t.buyerPhone || '-'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-mono text-slate-700 truncate max-w-[180px]">{t.buyerEmail}</span>
                        </p>
                      </div>

                      {/* Date & Location */}
                      <div className="space-y-1 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#08ADAE]" />
                          <span>
                            {format(new Date(t.eventStartDate), 'd MMMM yyyy, HH:mm', { locale: localeId })} WIB
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#08ADAE]" />
                          <span className="truncate">{t.eventLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-center gap-2">
                      <Link
                        href={`/e-ticket/${t.ticketId}`}
                        className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#08ADAE] hover:bg-[#07999A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Buka E-Ticket</span>
                      </Link>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleResend(t.ticketId)}
                          disabled={isResending}
                          title="Kirim ulang tiket ke WhatsApp dan Email"
                          className="flex-1 sm:flex-none p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isResending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span className="sm:hidden">Kirim Ulang</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyTicketLink(t.ticketId)}
                          title="Salin tautan e-ticket"
                          className="flex-1 sm:flex-none p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span className="sm:hidden">Salin Link</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Helpful FAQ Section for Guest Buyers */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-5 border border-white/80">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#08ADAE]" />
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Panduan Pembelian Tanpa Login (Guest Checkout)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5 border border-white/80">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Bagaimana jika browser tertutup saat memesan?
            </h4>
            <p className="text-slate-500">
              Jika Anda sudah berhasil transfer/scan QRIS, pembayaran Anda tetap aman karena terverifikasi otomatis oleh server bank. E-ticket akan otomatis dikirimkan ke WhatsApp Anda.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5 border border-white/80">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Di mana saya bisa membuka E-Ticket?
            </h4>
            <p className="text-slate-500">
              E-ticket dapat langsung dibuka lewat tautan yang masuk ke chat WhatsApp resmi TAQtix, email Anda, atau melalui halaman pencarian tiket ini kapan saja.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5 border border-white/80">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Apakah tiket ini bisa masuk ke akun saya?
            </h4>
            <p className="text-slate-500">
              Bisa! Jika sewaktu-waktu Anda membuat akun atau login dengan alamat email yang sama, seluruh tiket yang pernah Anda beli akan otomatis muncul di menu <strong>Tiket Saya</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5 border border-white/80">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Bagaimana cara check-in saat hari-H?
            </h4>
            <p className="text-slate-500">
              Cukup buka link E-Ticket Anda di ponsel dan tunjukkan QR Code ke petugas scanner di pintu masuk acara. Anda tidak perlu mencetak tiket fisik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
