'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Clock,
  ArrowLeft,
  Calendar,
  MapPin,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/checkout/countdown-timer';

interface OrderDetail {
  id: string;
  totalAmount: number;
  status: string;
  expiredAt: string;
  event?: {
    id: string;
    slug?: string;
    title: string;
    location?: string;
    startDate?: string;
    isDateTba?: boolean;
  };
}

function CheckoutCancelledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${orderId}`);
        const data = res.data?.data;
        if (data) {
          setOrder(data);
          const expiredTime = new Date(data.expiredAt).getTime();
          const now = Date.now();
          if (now >= expiredTime || data.status === 'EXPIRED') {
            setIsExpired(true);
          }
        }
      } catch {
        // Order not found or fetch error
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat rincian transaksi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="bg-white border-amber-200 shadow-xl rounded-3xl overflow-hidden border">
        {/* Banner Pembatalan */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white p-8 text-center flex flex-col items-center border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800">
            {isExpired ? 'Waktu Pemesanan Berakhir' : 'Pembayaran Dibatalkan'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            {isExpired
              ? 'Batas waktu 10 menit untuk menyelesaikan transaksi telah habis dan kuota tiket Anda telah dilepas kembali.'
              : 'Anda telah membatalkan proses transaksi di halaman DOKU Checkout atau belum menyelesaikan pembayaran.'}
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Sisa Waktu Pembayaran (Jika belum expired) */}
          {order && !isExpired && order.expiredAt && (
            <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sisa Waktu Pembayaran
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Pesanan Anda masih tersimpan sementara.
                </p>
              </div>

              <CountdownTimer
                expiredAt={order.expiredAt}
                onExpire={() => setIsExpired(true)}
              />
            </div>
          )}

          {/* Rincian Pesanan Singkat */}
          {order && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">ID Pesanan</span>
                <span className="font-mono font-bold text-slate-700">{order.id}</span>
              </div>

              {order.event && (
                <div className="pt-1">
                  <p className="font-bold text-slate-800 text-sm">{order.event.title}</p>
                  <div className="flex flex-wrap gap-3 text-slate-500 mt-1">
                    {order.event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#08B4B5]" />
                        {order.event.location}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Tagihan</span>
                <span className="text-sm font-extrabold text-slate-900">
                  Rp {Math.round(order.totalAmount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isExpired && order ? (
              <Link href={`/checkout?orderId=${order.id}`} className="flex-1">
                <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCcw className="h-4 w-4" />
                  <span>Coba Bayar Lagi</span>
                </Button>
              </Link>
            ) : order?.event?.slug ? (
              <Link href={`/events/${order.event.slug}`} className="flex-1">
                <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Pesan Ulang Tiket</span>
                </Button>
              </Link>
            ) : (
              <Link href="/" className="flex-1">
                <Button className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl border-0 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Cari Event Lain</span>
                </Button>
              </Link>
            )}

            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl cursor-pointer"
              >
                <Home className="h-4 w-4 mr-1.5" />
                <span>Ke Beranda</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat halaman...</p>
        </div>
      }
    >
      <CheckoutCancelledContent />
    </Suspense>
  );
}
