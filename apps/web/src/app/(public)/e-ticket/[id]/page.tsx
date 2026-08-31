'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Ticket, ShieldAlert, ArrowLeft, Download, User, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TicketDetails {
  ticketId: string;
  ticketStatus: 'VALID' | 'CHECKED_IN' | 'CANCELLED';
  ticketCategory: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  organizerName: string;
  signedQrPayload: string;
}

export default function ETicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.id as string;

  const { data: ticketResponse, isLoading, error } = useQuery({
    queryKey: ['public-ticket', ticketId],
    queryFn: async () => {
      const res = await apiClient.get(`/tickets/${ticketId}`);
      return res.data;
    },
    enabled: !!ticketId,
  });

  const ticket: TicketDetails | null = ticketResponse?.data || null;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `E-Ticket ${ticket?.eventTitle}`,
          text: `Ini e-ticket untuk ${ticket?.buyerName} di acara ${ticket?.eventTitle}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link e-ticket berhasil disalin ke clipboard!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 space-y-6">
        <Skeleton className="h-8 w-1/3 bg-slate-900 mx-auto" />
        <Skeleton className="h-[480px] w-full bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100">Tiket Tidak Ditemukan</h2>
        <p className="text-slate-400">ID e-ticket tidak valid atau tiket telah dibatalkan.</p>
        <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer">
          Kembali ke Discovery
        </Button>
      </div>
    );
  }

  const formattedDateRange = `${format(new Date(ticket.eventStartDate), 'd MMMM yyyy, HH:mm', {
    locale: localeId,
  })} WIB`;

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6 space-y-6">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Ke Discovery</span>
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            variant="ghost"
            className="text-slate-450 hover:text-white hover:bg-slate-900/60 rounded-xl gap-1.5 cursor-pointer text-xs p-2 h-9"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Bagikan</span>
          </Button>
        </div>
      </div>

      {/* Ticket Card */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-md rounded-3xl overflow-hidden border-t-4 border-t-indigo-500">
        <CardContent className="p-6 space-y-6 flex flex-col items-center">
          {/* Header */}
          <div className="text-center w-full pb-4 border-b border-dashed border-slate-800">
            <h2 className="text-base font-extrabold text-slate-100 truncate">{ticket.eventTitle}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">ID TIKET: {ticket.ticketId}</p>
          </div>

          {/* QR Display */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl flex items-center justify-center shadow-inner relative">
            {ticket.ticketStatus === 'CHECKED_IN' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10 border border-slate-800">
                <CheckBadge />
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mt-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                  Checked In
                </span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">
                  Tiket sudah digunakan masuk gerbang
                </span>
              </div>
            )}

            {ticket.ticketStatus === 'CANCELLED' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10 border border-slate-850">
                <ShieldAlert className="h-10 w-10 text-rose-500" />
                <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest mt-2 bg-rose-500/10 border border-rose-500/25 px-3 py-1 rounded-full">
                  Cancelled
                </span>
              </div>
            )}

            <QRCodeSVG
              value={ticket.signedQrPayload}
              size={200}
              bgColor="transparent"
              fgColor="#ffffff"
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Ticket status badge */}
          {ticket.ticketStatus === 'VALID' && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full uppercase tracking-wider">
              Tiket Valid — Siap di-Scan
            </span>
          )}

          {/* Ticket Information */}
          <div className="w-full space-y-4 pt-2 text-sm text-slate-300">
            {/* Kategori & Pemilik */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kategori</span>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{ticket.ticketCategory}</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pemilik</span>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="truncate">{ticket.buyerName}</span>
                </span>
              </div>
            </div>

            {/* Waktu & Tempat */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Waktu Mulai</h4>
                  <p className="text-slate-350 font-semibold">{formattedDateRange}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Lokasi</h4>
                  <p className="text-slate-350 font-semibold leading-relaxed">{ticket.eventLocation}</p>
                </div>
              </div>
            </div>

            {/* Transfer Ticket Action */}
            {ticket.ticketStatus === 'VALID' && (
              <div className="pt-3 border-t border-slate-850">
                <TransferModal ticketId={ticket.ticketId} currentEmail={ticket.buyerEmail} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransferModal({ ticketId, currentEmail }: { ticketId: string; currentEmail: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [toName, setToName] = React.useState('');
  const [toEmail, setToEmail] = React.useState('');
  const [toPhone, setToPhone] = React.useState('');
  const [transferSuccess, setTransferSuccess] = React.useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.post(`/tickets/${ticketId}/transfer`, {
        toName: toName.trim(),
        toEmail: toEmail.trim(),
        toPhone: toPhone.trim(),
      });
      setTransferSuccess(true);
      toast.success('Permintaan transfer tiket telah dibuat!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan transfer tiket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl text-xs font-semibold gap-2 cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5 text-indigo-400" />
        <span>Transfer Kepemilikan Tiket Ini</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-indigo-400" />
              Transfer Tiket ke Orang Lain
            </h3>

            {transferSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2 text-xs">
                <p className="font-bold text-emerald-400">Permintaan Transfer Dikirim!</p>
                <p className="text-slate-300">
                  QR Code lama Anda sementara dinonaktifkan hingga penerima mengonfirmasi transfer.
                </p>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.reload();
                  }}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold w-full"
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="space-y-3 text-xs">
                <p className="text-slate-400">
                  Masukkan identitas penerima baru. QR Code tiket Anda akan dinonaktifkan sementara dan penerima akan mendapatkan link konfirmasi.
                </p>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nama Lengkap Penerima</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Email Penerima</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@example.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">No. WhatsApp Penerima</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={toPhone}
                    onChange={(e) => setToPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="w-1/2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white cursor-pointer"
                  >
                    {submitting ? 'Proses...' : 'Kirim Transfer'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CheckBadge() {
  return (
    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
      <svg
        className="h-6 w-6 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}
