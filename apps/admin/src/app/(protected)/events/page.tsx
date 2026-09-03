'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Calendar,
  Search,
  AlertTriangle,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  organizerName: string;
  location: string;
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  startDate: string;
  endDate: string;
  ticketsSold: number;
  quota: number;
}

const formatDate = (isoString: string) => {
  return (
    new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  );
};

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmUnpublishModal, setConfirmUnpublishModal] = useState<{ id: string; title: string } | null>(null);

  // Fetch Events
  const { data: events = [], isLoading } = useQuery<EventItem[]>({
    queryKey: ['admin-events'],
    queryFn: () => api.get<EventItem[]>('/admin/events'),
  });

  // Force Unpublish Mutation
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/events/${id}/force-unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setConfirmUnpublishModal(null);
      toast.success('Event berhasil dikembalikan ke status Draft');
    },
  });

  // Filter logic
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#08B4B5]" />
          Moderasi & Pengawasan Event
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau seluruh event di platform dan lakukan tindakan moderasi (Force Unpublish) jika terdeteksi pelanggaran.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari judul event atau penyelenggara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="ended">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-[#08B4B5]/20 border-t-[#08B4B5] rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data event...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Tidak ada event yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Detail Event</th>
                  <th className="p-4">Penyelenggara</th>
                  <th className="p-4">Tanggal Pelaksanaan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Keterisian Kuota</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Event Detail */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{evt.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{evt.location}</div>
                    </td>

                    {/* Organizer */}
                    <td className="p-4 text-slate-700 font-medium">
                      {evt.organizerName}
                    </td>

                    {/* Dates */}
                    <td className="p-4 text-slate-600 font-mono text-xs">
                      {formatDate(evt.startDate)}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          evt.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : evt.status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            evt.status === 'published'
                              ? 'bg-emerald-500'
                              : evt.status === 'draft'
                              ? 'bg-slate-400'
                              : 'bg-rose-500'
                          }`}
                        />
                        {evt.status === 'published'
                          ? 'Published'
                          : evt.status === 'draft'
                          ? 'Draft'
                          : evt.status === 'ended'
                          ? 'Selesai'
                          : 'Dibatalkan'}
                      </span>
                    </td>

                    {/* Sales quota */}
                    <td className="p-4 font-mono text-slate-700">
                      <div>
                        {evt.ticketsSold} <span className="text-slate-400 font-normal">/ {evt.quota}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full bg-[#08B4B5] rounded-full"
                          style={{ width: `${Math.min(100, (evt.ticketsSold / evt.quota) * 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {evt.status === 'published' && (
                          <button
                            onClick={() => setConfirmUnpublishModal({ id: evt.id, title: evt.title })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Force Unpublish</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmUnpublishModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Batalkan Publikasi Event?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan publikasi event <strong>{confirmUnpublishModal.title}</strong>? Event ini akan dikembalikan menjadi status <strong>Draft</strong> sehingga pembeli tidak dapat membeli tiketnya. Tindakan ini akan dicatat ke dalam audit log admin.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setConfirmUnpublishModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={() => unpublishMutation.mutate(confirmUnpublishModal.id)}
                disabled={unpublishMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white transition-colors cursor-pointer"
              >
                {unpublishMutation.isPending ? 'Memproses...' : 'Ya, Force Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
