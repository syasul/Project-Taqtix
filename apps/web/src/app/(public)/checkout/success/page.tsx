'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Ticket,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Mail,
  MessageSquare,
  ShieldCheck,
  Calendar,
  MapPin,
  Home,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type PaymentVerificationState = 'polling' | 'success' | 'still_pending' | 'failed' | 'expired';

interface TicketItem {
  id: string;
  qrPayload?: string;
  orderItem?: {
    attendeeName?: string;
    ticketCategory?: {
      name?: string;
    };
  };
}

interface OrderDetail {
  id: string;
  totalAmount: number;
  status: string;
  expiredAt?: string;
  createdAt?: string;
  buyer?: {
    name?: string;
    email?: string;
  };
  event?: {
    id: string;
    title: string;
    location?: string;
    startDate?: string;
  };
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';

  const [verificationState, setVerificationState] = useState<PaymentVerificationState>('polling');
  const [pollSecondsElapsed, setPollSecondsElapsed] = useState(0);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isManualRechecking, setIsManualRechecking] = useState(false);

  const maxPollingSeconds = 30;
  const pollIntervalMs = 2000;
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingStoppedRef = useRef(false);

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return null;
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      const data = res.data?.data;
      if (data) {
        setOrder(data);
        return data;
      }
    } catch {
      // Ignore initial order load errors
    }
    return null;
  }, [orderId]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await apiClient.get(`/tickets/by-order/${orderId}`);
      const ticketList = res.data?.data || [];
      setTickets(ticketList);
    } catch (err) {
      console.warn('Gagal memuat e-ticket:', err);
    }
  }, [orderId]);

  // Check payment status once
  const checkStatusOnce = useCallback(async (): Promise<'success' | 'failed' | 'expired' | 'pending' | null> => {
    if (!orderId) return null;
    try {
      const res = await apiClient.get(`/payments/${orderId}/status`);
      const status = String(res.data?.data?.status || '').toLowerCase();
      if (status === 'success' || status === 'paid') return 'success';
      if (status === 'failed') return 'failed';
      if (status === 'expired') return 'expired';
      return 'pending';
    } catch {
      return null;
    }
  }, [orderId]);

  // Run the polling cycle
  const startPolling = useCallback(() => {
    if (!orderId) return;

    isPollingStoppedRef.current = false;
    setVerificationState('polling');
    setPollSecondsElapsed(0);

    const startTime = Date.now();

    const tick = async () => {
      if (isPollingStoppedRef.current) return;

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setPollSecondsElapsed(elapsed);

      const statusResult = await checkStatusOnce();

      if (statusResult === 'success') {
        isPollingStoppedRef.current = true;
        setVerificationState('success');
        toast.success('Pembayaran terverifikasi sukses!');
        await fetchTickets();
        await fetchOrderDetails();
        return;
      }

      if (statusResult === 'failed') {
        isPollingStoppedRef.current = true;
        setVerificationState('failed');
        toast.error('Pembayaran gagal atau dibatalkan.');
        return;
      }

      if (statusResult === 'expired') {
        isPollingStoppedRef.current = true;
        setVerificationState('expired');
        toast.error('Batas waktu pembayaran telah kedaluwarsa.');
        return;
      }

      // If max timeout reached and still pending
      if (elapsed >= maxPollingSeconds) {
        isPollingStoppedRef.current = true;
        setVerificationState('still_pending');
        await fetchOrderDetails();
        return;
      }

      // Schedule next tick
      pollTimerRef.current = setTimeout(tick, pollIntervalMs);
    };

    // Initial tick
    tick();
  }, [orderId, checkStatusOnce, fetchTickets, fetchOrderDetails]);

  // Manual re-check handler
  const handleManualRecheck = async () => {
    setIsManualRechecking(true);
    try {
      const status = await checkStatusOnce();
      if (status === 'success') {
        setVerificationState('success');
        toast.success('Pembayaran sukses terverifikasi!');
        await fetchTickets();
        await fetchOrderDetails();
      } else if (status === 'failed') {
        setVerificationState('failed');
      } else if (status === 'expired') {
        setVerificationState('expired');
      } else {
        toast.info('Status pembayaran masih menunggu konfirmasi bank. Silakan coba lagi beberapa saat.');
      }
    } finally {
      setIsManualRechecking(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      router.replace('/checkout');
      return;
    }

    fetchOrderDetails();
    startPolling();

    return () => {
      isPollingStoppedRef.current = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [orderId, router, fetchOrderDetails, startPolling]);

  if (!orderId) {
    return null;
  }

  // =========================================================================
  // 1. STATE: POLLING VERIFIKASI (0-30s)
  // =========================================================================
  if (verificationState === 'polling') {
    const progressPercent = Math.min(100, Math.round((pollSecondsElapsed / maxPollingSeconds) * 100));

    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden text-center">
          <div className="bg-gradient-to-br from-[#08B4B5]/10 via-teal-50 to-white p-8 pb-6 border-b border-slate-100 flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#08B4B5]/15 flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 text-[#08B4B5] animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                <ShieldCheck className="h-5 w-5 text-[#08B4B5]" />
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-800 mt-5">
              Memverifikasi Pembayaran...
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Menerima konfirmasi transaksi dari server DOKU Payment Gateway. Mohon jangan menutup halaman ini.
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Pengecekan transaksi</span>
                <span className="font-mono text-[#08B4B5]">
                  {pollSecondsElapsed}s / {maxPollingSeconds}s
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#08B4B5] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-1">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                ID Pemesanan
              </p>
              <p className="text-xs font-mono font-bold text-slate-700 break-all">
                {orderId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // 2. STATE: PEMBAYARAN SUKSES & TIKET TERBIT
  // =========================================================================
  if (verificationState === 'success') {
    const firstTicketId = tickets[0]?.id;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <Card className="bg-white border-emerald-100 shadow-xl rounded-3xl overflow-hidden border-2">
          {/* Header Banner Sukses */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-[#08B4B5] p-8 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pembayaran Berhasil!
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Transaksi Anda telah dikonfirmasi dan e-ticket elektronik Anda resmi diterbitkan.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Event & Order Info */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nomor Invoice / Pemesanan
                  </span>
                  <p className="text-xs sm:text-sm font-mono font-extrabold text-slate-800">
                    TAQTIX-ORD-{orderId.substring(0, 13)}
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 self-start sm:self-auto rounded-full font-bold text-xs">
                  PAID (Lunas)
                </Badge>
              </div>

              {order?.event && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-bold text-slate-800 text-base">
                    {order.event.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    {order.event.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#08B4B5]" />
                        {new Date(order.event.startDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {order.event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#08B4B5]" />
                        {order.event.location}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tiket Terbit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[#08B4B5]" />
                  <span>E-Ticket Resmi Anda ({tickets.length})</span>
                </h4>
                {firstTicketId && (
                  <Link
                    href={`/e-ticket/${firstTicketId}`}
                    target="_blank"
                    className="text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1"
                  >
                    <span>Buka Tiket</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {tickets.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-[#08B4B5] transition shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#08B4B5] font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {t.orderItem?.ticketCategory?.name || 'Tiket Masuk Event'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {t.orderItem?.attendeeName || 'Pengunjung'} • ID: {t.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/e-ticket/${t.id}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#08B4B5] hover:text-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Lihat QR</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification delivery reminder */}
            <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 text-[#08B4B5]">
                <Mail className="h-4 w-4" />
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Tiket Terkirim Otomatis</p>
                <p>
                  Salinan e-ticket elektronik dan barcode scan check-in telah kami kirimkan juga ke alamat WhatsApp & Email Anda.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {firstTicketId ? (
                <Link href={`/e-ticket/${firstTicketId}`} className="flex-1">
                  <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                    <Ticket className="h-4 w-4" />
                    <span>Buka E-Ticket Utama</span>
                  </Button>
                </Link>
              ) : (
                <Link href={`/orders`} className="flex-1">
                  <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 shadow-md">
                    <span>Lihat Daftar Pesanan</span>
                  </Button>
                </Link>
              )}

              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl cursor-pointer"
                >
                  <Home className="h-4 w-4 mr-1.5" />
                  <span>Kembali ke Beranda</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // 3. STATE: MASIH PENDING SETELAH 30 DETIK (BUKAN ERROR)
  // =========================================================================
  if (verificationState === 'still_pending') {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <Card className="bg-white border-amber-200 shadow-xl rounded-3xl overflow-hidden border">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-white p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              Pembayaran Sedang Diproses
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              Sistem kami sedang menunggu konfirmasi notifikasi webhook dari DOKU Payment Gateway / jaringan bank Anda.
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-semibold">Status Transaksi:</span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  Menunggu Konfirmasi Webhook
                </Badge>
              </div>
              <p>
                Jika Anda sudah menyelesaikan pembayaran di halaman DOKU, dana Anda dipastikan aman. Tiket dan QR Code akan otomatis terbit dan dikirimkan ke WhatsApp & Email Anda dalam beberapa saat.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                onClick={handleManualRecheck}
                disabled={isManualRechecking}
                className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                {isManualRechecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengecek Ulang Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Cek Ulang Status Pembayaran</span>
                  </>
                )}
              </Button>

              <Link href="/orders" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl cursor-pointer"
                >
                  <span>Cek di Halaman Pesanan Saya</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // 4. STATE: PEMBAYARAN FAILED / KEDALUWARSA
  // =========================================================================
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card className="bg-white border-rose-200 shadow-xl rounded-3xl overflow-hidden text-center border">
        <div className="bg-rose-50 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">
            {verificationState === 'expired'
              ? 'Waktu Pembayaran Telah Habis'
              : 'Pembayaran Gagal'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {verificationState === 'expired'
              ? 'Batas waktu 10 menit untuk menyelesaikan pembayaran telah berakhir dan kuota tiket telah dikembalikan.'
              : 'Transaksi tidak dapat diselesaikan atau ditolak oleh pihak bank.'}
          </p>
        </div>

        <CardContent className="p-6 space-y-4">
          <Link href={`/checkout?orderId=${orderId}`} className="block">
            <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 cursor-pointer">
              Coba Bayar Lagi
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl cursor-pointer"
            >
              Kembali ke Beranda
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#08B4B5] animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat status pesanan...</p>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
