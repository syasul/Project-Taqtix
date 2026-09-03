'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeftRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
  const router = useRouter();
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

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Histori Transfer Tiket' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <ArrowLeftRight className="h-6 w-6 text-[#08B4B5]" />
            Histori Transfer Tiket
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Pantau seluruh aktivitas serah-terima kepemilikan tiket antar pengunjung untuk validasi identitas penonton.
          </p>
        </div>

        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="outline"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md shadow-xs">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari email pengirim / penerima..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <ArrowLeftRight className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-sm">Belum Ada Permintaan Transfer</h3>
          <p className="text-slate-400 text-xs mt-1">
            Jika penonton mengalihkan tiketnya, riwayat serah-terima akan dicatat di sini.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Waktu Pengajuan</th>
                  <th className="py-3.5 px-5">Pemilik Asal</th>
                  <th className="py-3.5 px-5">Penerima Baru</th>
                  <th className="py-3.5 px-5">Kategori Tiket</th>
                  <th className="py-3.5 px-5">Status Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5 text-slate-500 font-mono">
                      {new Date(t.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-900 font-medium">{t.fromEmail}</td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900 block">{t.toName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{t.toEmail}</span>
                    </td>
                    <td className="py-4 px-5 font-bold text-[#08B4B5]">
                      {t.ticket?.orderItem?.ticketCategory?.name || 'Tiket Event'}
                    </td>
                    <td className="py-4 px-5">
                      {t.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Selesai
                        </span>
                      ) : t.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-500" />
                          Menunggu Konfirmasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="h-3 w-3 text-slate-400" />
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
