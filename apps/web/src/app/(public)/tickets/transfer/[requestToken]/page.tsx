'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  AlertCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  Lock,
  LogIn,
  User,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

interface TransferDetails {
  id: string;
  requestToken: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  expiresAt: string;
  fromEmailMasked: string;
  toName: string;
  toEmail: string;
  toPhone: string;
  event: {
    id: string;
    title: string;
    bannerUrl?: string;
    location: string;
    startDate: string;
    endDate: string;
    isDateTba?: boolean;
    organizerName: string;
  };
  ticketCategory: {
    id: string;
    name: string;
    price: number;
  };
  ticketId: string;
  transferCount: number;
}

export default function ClaimTransferPage() {
  const router = useRouter();
  const params = useParams();
  const requestToken = params?.requestToken as string;
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [completedTicketId, setCompletedTicketId] = useState<string | null>(null);

  // Fetch transfer details
  const {
    data: transferResponse,
    isLoading: transferLoading,
    error,
  } = useQuery({
    queryKey: ['ticket-transfer-detail', requestToken],
    queryFn: async () => {
      const res = await apiClient.get(`/tickets/transfer/${requestToken}`);
      return res.data;
    },
    enabled: !!requestToken,
    retry: false,
  });

  const transfer: TransferDetails | null = transferResponse?.data || transferResponse || null;

  const handleConfirm = async () => {
    if (!user) {
      toast.error('Anda harus masuk (login) ke akun TAQtix terlebih dahulu.');
      router.push(`/login?redirect=${encodeURIComponent(`/tickets/transfer/${requestToken}`)}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/tickets/transfer/${requestToken}/confirm`);
      const newTicketId =
        res.data?.ticket?.id ||
        res.data?.data?.ticket?.id ||
        res.data?.ticketId ||
        res.data?.data?.ticketId ||
        transfer?.ticketId;

      toast.success('Pengalihan tiket berhasil dikonfirmasi ke akun Anda!');
      if (newTicketId) {
        setCompletedTicketId(newTicketId);
        setTimeout(() => {
          router.push(`/e-ticket/${newTicketId}`);
        }, 1500);
      } else {
        router.push('/tickets');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengonfirmasi transfer tiket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menolak pengalihan tiket ini? Tiket akan dikembalikan ke pemilik asal.',
      )
    ) {
      return;
    }

    try {
      setDeclining(true);
      await apiClient.post(`/tickets/transfer/${requestToken}/decline`);
      toast.success('Permintaan transfer tiket dibatalkan.');
      router.push('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membatalkan transfer');
    } finally {
      setDeclining(false);
    }
  };

  if (!mounted || transferLoading) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat rincian tiket resmi...</p>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Tautan Transfer Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tautan transfer tidak valid atau telah dibatalkan. Pastikan Anda membuka tautan yang benar dari pemilik tiket.
        </p>
        <Button
          onClick={() => router.push('/')}
          className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold border-0"
        >
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 p-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-[#08B4B5]/30 text-[#08B4B5] flex items-center justify-center mx-auto mb-1">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-extrabold text-slate-900">
            Klaim Kepemilikan Tiket
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pengalihan tiket resmi acara dari sesama pembeli (Fan-to-Fan Transfer).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {completedTicketId ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Tiket Berhasil Diklaim!</h3>
              <p className="text-xs text-slate-600">
                E-tiket baru Anda telah diterbitkan ke akun Anda. Mengalihkan ke halaman e-ticket...
              </p>
            </div>
          ) : transfer.status === 'completed' ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Tiket Sudah Diklaim</h3>
              <p className="text-slate-500">
                Permintaan transfer ini telah selesai diklaim dan tiket sudah berada di akun penerima.
              </p>
              <Button
                onClick={() => router.push('/')}
                className="mt-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl border-0"
              >
                Kembali ke Beranda
              </Button>
            </div>
          ) : transfer.status === 'expired' ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 text-xs">
              <XCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="font-bold text-rose-800 text-sm">Transfer Kedaluwarsa</h3>
              <p className="text-slate-600">
                Batas waktu klaim 24 jam telah habis. Tiket telah otomatis dikembalikan ke pemilik awal.
              </p>
            </div>
          ) : transfer.status === 'cancelled' ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Transfer Dibatalkan</h3>
              <p className="text-slate-500">
                Permintaan transfer ini telah dibatalkan oleh pemilik tiket.
              </p>
            </div>
          ) : (
            <>
              {/* Event & Ticket Details Preview */}
              <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Acara & Penyelenggara
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {transfer.event.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    oleh {transfer.event.organizerName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 text-slate-600">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px]">
                      {transfer.event.isDateTba
                        ? 'Waktu Segera Diumumkan'
                        : format(new Date(transfer.event.startDate), 'd MMMM yyyy', {
                            locale: localeId,
                          })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] truncate">{transfer.event.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#08B4B5]" />
                    <span className="font-bold text-slate-900 text-xs">
                      {transfer.ticketCategory.name}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 font-mono text-xs">
                    Rp {Number(transfer.ticketCategory.price).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Ditransfer oleh: {transfer.fromEmailMasked}</span>
                  <span>Ditujukan ke: {transfer.toName}</span>
                </div>
              </div>

              {/* Security Protection Explanation */}
              <div className="p-3.5 bg-teal-50/70 border border-[#08B4B5]/25 rounded-2xl space-y-1.5 text-xs text-teal-950">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-[#08B4B5] shrink-0" />
                  <span>Sistem Anti-Duplikasi & Anti-Percaloan TAQtix:</span>
                </div>
                <ul className="text-[11px] text-teal-900 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>QR Code lama langsung hangus:</strong> Pemilik lama tidak dapat lagi menggunakan barcode sebelumnya.
                  </li>
                  <li>
                    <strong>Penerbitan QR Code baru:</strong> QR Code baru hanya akan diterbitkan langsung ke akun Anda setelah konfirmasi.
                  </li>
                  <li>
                    <strong>Otentikasi Akun Resmi:</strong> Tiket terikat aman pada akun penerima sah dan dapat dipindahtangankan kembali jika sewaktu-waktu berhalangan hadir (apabila diizinkan oleh kebijakan event).
                  </li>
                </ul>
              </div>

              {/* AUTH CHECK: Receiver MUST be logged in */}
              {!user ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950 block text-xs">
                        Wajib Masuk (Login) Akun TAQtix
                      </span>
                      <p className="text-[11px] text-amber-800 leading-normal mt-0.5">
                        Demi verifikasi identitas dan keamanan e-tiket, Anda wajib masuk atau membuat akun TAQtix untuk menyimpan tiket resmi ini.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      router.push(
                        `/login?redirect=${encodeURIComponent(`/tickets/transfer/${requestToken}`)}`,
                      )
                    }
                    className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-2 border-0 shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk / Buat Akun untuk Mengklaim Tiket</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Verified user card */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#08B4B5]/10 text-[#08B4B5] flex items-center justify-center font-bold text-xs uppercase">
                        {user.email ? user.email.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Mengklaim sebagai:</span>
                        <span className="font-bold text-slate-800 text-xs block truncate max-w-[200px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Akun Terverifikasi
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <Button
                      onClick={handleConfirm}
                      disabled={submitting || declining}
                      className="w-full bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold py-3.5 rounded-xl cursor-pointer shadow-sm border-0 flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Menerbitkan E-Tiket Baru...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Konfirmasi & Terima Tiket ke Akun Saya</span>
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleDecline}
                      disabled={submitting || declining}
                      variant="outline"
                      className="w-full border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      {declining ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      <span>Tolak Transfer Tiket</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
