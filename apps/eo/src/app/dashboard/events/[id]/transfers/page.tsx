'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeftRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';

interface TransferItem {
  id: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  toPhone: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  requestedAt: string;
  completedAt: string | null;
  ticket: {
    id: string;
    orderItem: {
      ticketCategory: {
        name: string;
      };
    };
  };
}

export default function EventTransfersPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/organizer/events/${eventId}/transfers`);
      setTransfers(res.data?.data || res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat data transfer tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchTransfers();
  }, [eventId]);

  const filtered = transfers.filter(
    (t) =>
      t.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          Histori Transfer Tiket
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Pantau seluruh aktivitas pengalihan kepemilikan tiket antar pengunjung untuk memvalidasi identitas penonton.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari email pengirim / penerima..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <ArrowLeftRight className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">Belum Ada Permintaan Transfer</h3>
          <p className="text-slate-500 text-xs mt-1">
            Jika penonton mengalihkan tiketnya, riwayat serah-terima akan dicatat di sini.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-850 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Waktu Pengajuan</th>
                  <th className="py-3.5 px-5">Pemilik Asal</th>
                  <th className="py-3.5 px-5">Penerima Baru</th>
                  <th className="py-3.5 px-5">Kategori Tiket</th>
                  <th className="py-3.5 px-5">Status Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/30 transition">
                    <td className="py-4 px-5 text-slate-400">
                      {new Date(t.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-200">{t.fromEmail}</td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-100 block">{t.toName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{t.toEmail}</span>
                    </td>
                    <td className="py-4 px-5 font-bold text-indigo-400">
                      {t.ticket?.orderItem?.ticketCategory?.name || 'Tiket Event'}
                    </td>
                    <td className="py-4 px-5">
                      {t.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai
                        </span>
                      ) : t.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Menunggu Konfirmasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          <XCircle className="h-3 w-3" />
                          {t.status}
                        </span>
                      )}
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
