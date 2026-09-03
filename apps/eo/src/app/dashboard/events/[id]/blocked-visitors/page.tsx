'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  UserX,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Ban,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface BlockedTicket {
  id: string;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  orderItem: {
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    ticketCategory: {
      name: string;
    };
  };
}

export default function BlockedVisitorsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [blockedList, setBlockedList] = useState<BlockedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketIdToBlock, setTicketIdToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBlocked = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/blocked-visitors`);
      setBlockedList(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat daftar pengunjung nonaktif');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchBlocked();
  }, [eventId]);

  const handleBlockTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      await apiClient.post(`/organizer/tickets/${ticketIdToBlock.trim()}/block`, {
        reason: blockReason.trim() || undefined,
      });

      setSuccessMsg('Tiket pengunjung berhasil diblokir');
      setIsOpen(false);
      setTicketIdToBlock('');
      setBlockReason('');
      fetchBlocked();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memblokir tiket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (ticketId: string) => {
    if (!confirm('Buka blokir untuk tiket ini? Tiket akan kembali dapat digunakan untuk check-in gerbang.')) {
      return;
    }

    try {
      await apiClient.post(`/organizer/tickets/${ticketId}/unblock`);
      fetchBlocked();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal membuka blokir');
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Pengunjung Nonaktif' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <UserX className="h-6 w-6 text-rose-500" />
            Pengunjung Nonaktif (Blacklist / Blocked)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Daftar tiket yang diblokir oleh panitia. Tiket yang diblokir akan langsung ditolak di gerbang scan (403 TICKET_BLOCKED).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-0">
              <Ban className="h-4 w-4" />
              <span>Blokir Tiket Pengunjung</span>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ban className="h-5 w-5 text-rose-500" />
                  Blokir Tiket Pengunjung
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleBlockTicket} className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    ID Tiket (UUID Tiket) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={ticketIdToBlock}
                    onChange={(e) => setTicketIdToBlock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-rose-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Alasan Pemblokiran *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Contoh: Indikasi pemalsuan bukti transfer / pelanggaran tata tertib acara"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eksekusi Pemblokiran'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : blockedList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <UserX className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Tidak Ada Tiket yang Diblokir</h3>
          <p className="text-slate-400 text-xs mt-1">
            Seluruh tiket yang terbit berada dalam status normal dan aktif.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Nama Pengunjung</th>
                  <th className="py-3.5 px-5">ID Tiket</th>
                  <th className="py-3.5 px-5">Kategori</th>
                  <th className="py-3.5 px-5">Alasan Pemblokiran</th>
                  <th className="py-3.5 px-5">Waktu Diblokir</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {blockedList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900 block">
                        {t.orderItem?.attendeeName || 'Pengunjung'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.orderItem?.attendeeEmail}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-400">
                      {t.id.substring(0, 13)}...
                    </td>
                    <td className="py-4 px-5 font-bold text-[#08B4B5]">
                      {t.orderItem?.ticketCategory?.name}
                    </td>
                    <td className="py-4 px-5 text-rose-600 font-medium">
                      {t.blockedReason || 'Pelanggaran peraturan'}
                    </td>
                    <td className="py-4 px-5 text-slate-400 font-mono">
                      {t.blockedAt
                        ? new Date(t.blockedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleUnblock(t.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Buka Blokir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
