'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400">
              <UserX className="h-6 w-6" />
            </div>
            Pengunjung Nonaktif (Blacklist / Blocked)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Daftar tiket yang diblokir oleh panitia. Tiket yang diblokir akan langsung ditolak di gerbang scan (403 TICKET_BLOCKED).
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer">
            <Ban className="h-4 w-4" />
            Blokir Tiket Pengunjung
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-400" />
                Blokir Tiket Pengunjung
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleBlockTicket} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ID Tiket (UUID Tiket)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={ticketIdToBlock}
                  onChange={(e) => setTicketIdToBlock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Alasan Pemblokiran
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Indikasi pemalsuan bukti transfer / pelanggaran tata tertib acara"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eksekusi Pemblokiran'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
        </div>
      ) : blockedList.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <UserX className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Tidak Ada Tiket yang Diblokir</h3>
          <p className="text-slate-500 text-xs mt-1">
            Seluruh tiket yang terbit berada dalam status normal dan aktif.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-850 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Nama Pengunjung</th>
                  <th className="py-3.5 px-5">ID Tiket</th>
                  <th className="py-3.5 px-5">Kategori</th>
                  <th className="py-3.5 px-5">Alasan Pemblokiran</th>
                  <th className="py-3.5 px-5">Waktu Diblokir</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {blockedList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/30 transition">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-100 block">
                        {t.orderItem?.attendeeName || 'Pengunjung'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.orderItem?.attendeeEmail}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-400">
                      {t.id.substring(0, 13)}...
                    </td>
                    <td className="py-4 px-5 font-bold text-indigo-400">
                      {t.orderItem?.ticketCategory?.name}
                    </td>
                    <td className="py-4 px-5 text-rose-300 font-medium">
                      {t.blockedReason || 'Pelanggaran peraturan'}
                    </td>
                    <td className="py-4 px-5 text-slate-400">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Buka Blokir
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
