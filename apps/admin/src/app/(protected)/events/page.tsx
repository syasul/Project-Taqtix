'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Calendar,
  Search,
  AlertTriangle,
  Pause,
} from 'lucide-react';

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
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Moderasi Event</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau semua event di platform dan lakukan tindakan moderasi (Force Unpublish) jika terdeteksi pelanggaran.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul event atau penyelenggara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-sm cursor-pointer"
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
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data event...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Tidak ada event ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="p-4">Detail Event</th>
                  <th className="p-4">Penyelenggara</th>
                  <th className="p-4">Tanggal Pelaksanaan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tiket Terjual</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    {/* Event Detail */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{evt.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{evt.location}</div>
                    </td>
                    {/* Organizer */}
                    <td className="p-4 text-slate-600">
                      {evt.organizerName}
                    </td>
                    {/* Dates */}
                    <td className="p-4 text-slate-600 font-mono text-xs">
                      {formatDate(evt.startDate)}
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          evt.status === 'published'
                            ? 'bg-emerald-55 text-emerald-700 border border-emerald-200'
                            : evt.status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-red-55 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          evt.status === 'published' ? 'bg-emerald-500' : evt.status === 'draft' ? 'bg-slate-400' : 'bg-red-500'
                        }`} />
                        {evt.status === 'published' ? 'Published' : evt.status === 'draft' ? 'Draft' : evt.status === 'ended' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </td>
                    {/* Sales quota */}
                    <td className="p-4 font-mono text-slate-600">
                      <div>{evt.ticketsSold} <span className="text-slate-400">/ {evt.quota}</span></div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full bg-red-500 rounded-full animate-pulse"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Force Unpublish
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-red-55 border border-red-200 text-red-600 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Batalkan Publikasi Event?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan publikasi event <strong>{confirmUnpublishModal.title}</strong>? Event ini akan dikembalikan menjadi status **Draft** sehingga pembeli tidak dapat membeli tiketnya. Tindakan ini akan dicatat ke dalam audit log admin.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-semibold">
              <button
                onClick={() => setConfirmUnpublishModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={() => unpublishMutation.mutate(confirmUnpublishModal.id)}
                disabled={unpublishMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors cursor-pointer"
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
