'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { 
  Users, 
  Send, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Ticket, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useIdempotency } from '@/hooks/use-idempotency';

export default function SegmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params?.id as string;
  const segmentId = params?.segmentId as string;

  const autoOpenCompose = searchParams?.get('compose') === 'true';

  const { idempotencyKey, refreshKey } = useIdempotency();
  const lastBroadcastTimeRef = React.useRef(0);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(autoOpenCompose);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('Halo {name}, tiket Anda siap! Nantikan penampilan memukau di panggung utama kami.');
  const [sending, setSending] = useState(false);

  // Active Broadcast Job Polling State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<any>(null);

  // Fetch Segment Members
  const { data: members = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ['segment-members', segmentId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/segments/${segmentId}/members`);
      return res.data?.data || [];
    },
    enabled: !!segmentId,
  });

  // Polling broadcast job status if active
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/organizer/broadcasts/${activeJobId}/status`);
        if (res.data?.success && res.data?.data) {
          const status = res.data.data;
          setBroadcastStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            if (status.status === 'completed') {
              toast.success('Pengiriman broadcast massal selesai!');
            } else {
              toast.error('Pengiriman broadcast mengalami kegagalan.');
            }
          }
        }
      } catch (err) {
        console.warn('Gagal memantau status broadcast:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  // Sample dynamic preview using random member name
  const sampleMember = members.length > 0 ? members[0] : { name: 'Budi Pratama' };
  const previewText = message.replace(/\{name\}/g, sampleMember.name || 'Budi Pratama');

  const handleStartCompose = () => {
    if (members.length === 0) {
      toast.error('Segmen ini belum memiliki anggota untuk dikirimkan pesan');
      return;
    }
    setIsComposeOpen(true);
  };

  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Pesan broadcast tidak boleh kosong');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleFinalSubmitBroadcast = async () => {
    // 500ms debounce & immediate lock (anti spam-click)
    const now = Date.now();
    if (now - lastBroadcastTimeRef.current < 500) return;
    if (sending) return;

    lastBroadcastTimeRef.current = now;
    try {
      setSending(true);
      const res = await apiClient.post(
        `/organizer/segments/${segmentId}/broadcast`,
        {
          message,
          channel,
          subject: channel === 'email' ? subject : undefined,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );

      if (res.data?.success) {
        toast.success('Antrean broadcast berhasil dijadwalkan!');
        setIsConfirmOpen(false);
        setIsComposeOpen(false);
        refreshKey(); // Generate key baru untuk broadcast berikutnya
        if (res.data.data?.jobId) {
          setActiveJobId(res.data.data.jobId);
        }
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal mengirimkan pesan broadcast',
      );
    } finally {
      setSending(false);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Segmen Audiens', href: `/dashboard/events/${eventId}/audience/segments` },
    { label: 'Detail Member Segmen' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Back button */}
      <div>
        <Link
          href={`/dashboard/events/${eventId}/audience/segments`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Segmen</span>
        </Link>
      </div>

      {/* Header & Broadcast CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#08B4B5]" />
            Daftar Anggota Segmen
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total teridentifikasi <strong className="text-slate-900 font-mono">{members.length}</strong> pembeli yang memenuhi kriteria filter segmen ini.
          </p>
        </div>

        <Button
          onClick={handleStartCompose}
          className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Send className="h-4 w-4" />
          <span>Kirim Broadcast Massal</span>
        </Button>
      </div>

      {/* Active Broadcast Job Progress Indicator */}
      {activeJobId && broadcastStatus && (
        <Card className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={cn("h-4 w-4 text-[#08B4B5]", broadcastStatus.status !== 'completed' && "animate-spin")} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Status Pengiriman: {broadcastStatus.status === 'completed' ? 'Selesai' : 'Sedang Mengirim...'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#08B4B5]">
              {broadcastStatus.sentCount || 0} / {broadcastStatus.totalRecipients || members.length} Terkirim
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#08B4B5] transition-all duration-300 rounded-full"
                style={{ 
                  width: `${Math.min(100, Math.round(((broadcastStatus.sentCount || 0) / Math.max(broadcastStatus.totalRecipients || 1, 1)) * 100))}%` 
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Pengiriman diproses via worker queue dengan rate limiter proteksi anti-spam.
            </p>
          </div>
        </Card>
      )}

      {/* Members Table */}
      <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Nama Lengkap</th>
                <th className="p-3.5">Kontak Email</th>
                <th className="p-3.5">Nomor WhatsApp</th>
                <th className="p-3.5">Kategori Tiket</th>
                <th className="p-3.5 text-right">Domisili Kota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {membersLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#08B4B5] mb-2" />
                    Memuat data anggota segmen...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    Belum ada pembeli tiket yang sesuai dengan kriteria filter segmen ini.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                        {(m.name || 'B').charAt(0).toUpperCase()}
                      </div>
                      <span>{m.name || 'Anonim'}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {m.email || '-'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {m.phone || '-'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-teal-50 text-[#08B4B5] border border-teal-200/50 rounded-md font-medium text-[11px]">
                        {m.ticketCategory || 'Reguler'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-500 font-mono">
                      {m.city || 'Kota Lainnya'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Step 1: Compose Broadcast */}
      {isComposeOpen && !isConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-[#08B4B5]" />
                Tulis Pesan Broadcast Massal
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleProceedToConfirmation} className="p-6 space-y-4">
              {/* Saluran Pengiriman */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Saluran Pengiriman *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer",
                      channel === 'whatsapp'
                        ? "bg-teal-50 border-[#08B4B5] text-[#08B4B5]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp Resmi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer",
                      channel === 'email'
                        ? "bg-teal-50 border-[#08B4B5] text-[#08B4B5]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Broadcast</span>
                  </button>
                </div>
              </div>

              {channel === 'email' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subjek Email *</label>
                  <input
                    type="text"
                    required
                    placeholder="Informasi Penting Acara TAQtix"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Textarea Pesan */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Isi Pesan *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Gunakan <code className="bg-slate-100 text-[#08B4B5] px-1 py-0.5 rounded">{'{name}'}</code> untuk nama pembeli
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ketik isi pesan Anda di sini..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Pratinjau Pesan Real-time */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#08B4B5]" />
                  Pratinjau Pesan Terkirim ({sampleMember.name})
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200/60 shadow-2xs whitespace-pre-wrap">
                  {previewText}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <Button
                  type="submit"
                  className="bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl"
                >
                  <span>Lanjutkan Konfirmasi</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Step 2: Konfirmasi 2 Langkah (Safety Guard) */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Pengiriman Broadcast</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pesan ini akan dikirim secara serentak ke <strong className="text-slate-900 font-mono text-sm">{members.length} orang</strong> dalam segmen ini. Aksi ini tidak dapat dibatalkan setelah dimulai.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-left text-[11px] text-slate-600 space-y-1 border border-slate-200/80">
                <div><strong>Kanal:</strong> {channel === 'whatsapp' ? 'WhatsApp Gateway' : 'Email SMTP'}</div>
                <div><strong>Jumlah Penerima:</strong> {members.length} kontak</div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={sending}
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-1/2 rounded-xl text-xs font-bold border-slate-200"
                >
                  Kembali Edit
                </Button>
                <Button
                  type="button"
                  disabled={sending}
                  onClick={handleFinalSubmitBroadcast}
                  className="w-1/2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Ya, Kirim Sekarang</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
