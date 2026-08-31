'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ClaimTransferPage() {
  const router = useRouter();
  const params = useParams();
  const requestToken = params?.requestToken as string;

  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [completedTicketId, setCompletedTicketId] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/tickets/transfer/${requestToken}/confirm`);
      const newTicketId = res.data?.ticket?.id || res.data?.data?.ticket?.id;

      toast.success('Pengalihan tiket berhasil dikonfirmasi!');
      if (newTicketId) {
        setCompletedTicketId(newTicketId);
        setTimeout(() => {
          router.push(`/e-ticket/${newTicketId}`);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengonfirmasi transfer tiket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Apakah Anda yakin ingin menolak pengalihan tiket ini? Tiket akan dikembalikan ke pemilik asal.')) {
      return;
    }

    try {
      setDeclining(true);
      await apiClient.post(`/tickets/transfer/${requestToken}/decline`);
      toast.success('Permintaan transfer dibatalkan.');
      router.push('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membatalkan transfer');
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-4 space-y-6">
      <Card className="bg-white border-slate-200 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-b border-slate-200 p-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center mx-auto mb-1">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-extrabold text-slate-900">
            Konfirmasi Transfer Tiket
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Seseorang ingin mengalihkan e-tiket acara ini kepada Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {completedTicketId ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Transfer Berhasil!</h3>
              <p className="text-xs text-slate-600">
                E-tiket baru Anda telah diterbitkan. Mengalihkan ke halaman e-ticket...
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Jaminan Keamanan Tiket Resmi TAQtix</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Setelah Anda mengonfirmasi penerimaan, QR code pemilik terdahulu akan dinonaktifkan secara permanen dan QR code baru yang sah akan diterbitkan khusus untuk Anda.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting || declining}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl cursor-pointer shadow-sm border-0 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Terima Tiket Sekarang
                </Button>

                <Button
                  onClick={handleDecline}
                  disabled={submitting || declining}
                  variant="outline"
                  className="w-full border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {declining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Tolak Transfer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
