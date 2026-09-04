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
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  Building2,
  MapPin,
  Ticket,
  DollarSign,
  Info,
  Globe,
  Zap,
  Tag,
  Sparkles,
  TrendingUp,
  Save,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  organizerName: string;
  location: string;
  status: 'draft' | 'published' | 'ended' | 'cancelled' | 'pending_approval';
  startDate: string;
  endDate: string;
  ticketsSold: number;
  quota: number;
  category?: string;
  description?: string;
  priceRange?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  adminSeoKeywords?: string;
  seoPriority?: 'NORMAL' | 'HIGH' | 'MAX_BOOST';
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

export default function EventsApprovalPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmUnpublishModal, setConfirmUnpublishModal] = useState<{ id: string; title: string } | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [rejectModal, setRejectModal] = useState<EventItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [seoModalEvent, setSeoModalEvent] = useState<EventItem | null>(null);
  const [adminKeywordsInput, setAdminKeywordsInput] = useState('');
  const [seoPriorityInput, setSeoPriorityInput] = useState<'NORMAL' | 'HIGH' | 'MAX_BOOST'>('NORMAL');

  // Fetch Events
  const { data: events = [], isLoading } = useQuery<EventItem[]>({
    queryKey: ['admin-events'],
    queryFn: () => api.get<EventItem[]>('/admin/events'),
  });

  // Update SEO Booster Mutation
  const updateSeoMutation = useMutation({
    mutationFn: (data: { id: string; adminSeoKeywords: string; seoPriority: string }) =>
      api.post(`/admin/events/${data.id}/seo`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setSeoModalEvent(null);
      toast.success('Pengaturan Double Engagement SEO Booster berhasil disimpan!');
    },
    onError: () => {
      toast.error('Gagal menyimpan pengaturan SEO booster');
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/events/${id}/approve`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Event berhasil disetujui & tayang di platform!');
      if (detailEvent?.id === data.data?.id) setDetailEvent(null);
    },
    onError: () => {
      toast.error('Gagal menyetujui event');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/events/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setRejectModal(null);
      setRejectReason('');
      toast.success('Event berhasil ditolak');
    },
    onError: () => {
      toast.error('Gagal menolak event');
    },
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

  const pendingCount = events.filter((e) => e.status === 'pending_approval').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const draftCount = events.filter((e) => e.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#08B4B5]" />
            Approval & Moderasi Event
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tinjau pengajuan event baru dari EO, berikan persetujuan penerbitan (Publish), atau lakukan moderasi.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-bold animate-pulse self-start md:self-auto">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Event Menunggu Approval</span>
          </div>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white border-[#08B4B5] shadow-sm ring-2 ring-[#08B4B5]/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500">Semua Event</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{events.length}</p>
        </div>

        <div
          onClick={() => setStatusFilter('pending_approval')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'pending_approval'
              ? 'bg-amber-50/60 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">Menunggu Approval</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('published')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-emerald-50/60 border-emerald-400 shadow-sm ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700">Tayang / Aktif</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('draft')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'draft'
              ? 'bg-slate-100 border-slate-400 shadow-sm ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500">Draft / Selesai</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{draftCount}</p>
        </div>
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
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="pending_approval">⏳ Menunggu Approval</option>
            <option value="published">✅ Tayang (Published)</option>
            <option value="draft">📝 Draft</option>
            <option value="cancelled">❌ Dibatalkan / Ditolak</option>
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
            Tidak ada event yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Event & Penyelenggara</th>
                  <th className="py-3.5 px-4">Lokasi & Waktu</th>
                  <th className="py-3.5 px-4">Penjualan / Kuota</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Double SEO Engagement</th>
                  <th className="py-3.5 px-4 text-right">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.organizerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{evt.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(evt.startDate)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        {evt.ticketsSold.toLocaleString()} / {evt.quota.toLocaleString()}
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#08B4B5] h-full"
                          style={{
                            width: `${Math.min(100, (evt.ticketsSold / (evt.quota || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {evt.status === 'pending_approval' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Menunggu Approval
                        </span>
                      )}
                      {evt.status === 'published' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Tayang (Published)
                        </span>
                      )}
                      {evt.status === 'draft' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Draft
                        </span>
                      )}
                      {evt.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Ditolak / Batal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSeoModalEvent(evt);
                          setAdminKeywordsInput(evt.adminSeoKeywords || '');
                          setSeoPriorityInput(evt.seoPriority || 'NORMAL');
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                          evt.adminSeoKeywords
                            ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Zap className={`w-3.5 h-3.5 ${evt.adminSeoKeywords ? 'text-[#08B4B5]' : 'text-slate-400'}`} />
                        <span>{evt.adminSeoKeywords ? '⚡ Boosted' : '+ Boost SEO'}</span>
                        {evt.seoPriority && evt.seoPriority !== 'NORMAL' && (
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                            evt.seoPriority === 'MAX_BOOST' ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white'
                          }`}>
                            {evt.seoPriority === 'MAX_BOOST' ? 'MAX' : 'HIGH'}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailEvent(evt)}
                          title="Lihat Detail Event"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {evt.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(evt.id)}
                              disabled={approveMutation.isPending}
                              title="Setujui Event & Publikasikan"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>

                            <button
                              onClick={() => setRejectModal(evt)}
                              title="Tolak Event"
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        {evt.status === 'published' && (
                          <button
                            onClick={() => setConfirmUnpublishModal({ id: evt.id, title: evt.title })}
                            title="Force Unpublish"
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Unpublish</span>
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

      {/* DETAIL MODAL */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#08B4B5] bg-[#08B4B5]/10 px-2 py-0.5 rounded-md">
                  {detailEvent.category || 'Event'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{detailEvent.title}</h3>
                <p className="text-xs text-slate-500">Penyelenggara: {detailEvent.organizerName}</p>
              </div>
              <button
                onClick={() => setDetailEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#08B4B5]" />
                  <span className="font-semibold text-slate-800">{detailEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#08B4B5]" />
                  <span>{formatDate(detailEvent.startDate)} - {formatDate(detailEvent.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#08B4B5]" />
                  <span>Kapasitas: {detailEvent.quota.toLocaleString()} Tiket (Terjual: {detailEvent.ticketsSold})</span>
                </div>
                {detailEvent.priceRange && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#08B4B5]" />
                    <span>Harga Tiket: {detailEvent.priceRange}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Deskripsi Event</h4>
                <p className="text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl">
                  {detailEvent.description || 'Tidak ada deskripsi rinci untuk event ini.'}
                </p>
              </div>

              {/* SEO Double Engagement Preview in Detail */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-[#08B4B5]" />
                    <span>Double Engagement SEO Status</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSeoModalEvent(detailEvent);
                      setAdminKeywordsInput(detailEvent.adminSeoKeywords || '');
                      setSeoPriorityInput(detailEvent.seoPriority || 'NORMAL');
                    }}
                    className="text-[10px] text-[#08B4B5] hover:underline font-bold"
                  >
                    Kelola Booster ↗
                  </button>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-600">
                    <strong className="text-slate-700">Keywords EO: </strong>
                    <span>{detailEvent.seoKeywords || 'Belum diisi EO'}</span>
                  </div>
                  <div className="text-teal-900 font-medium">
                    <strong className="text-teal-950">Platform Booster: </strong>
                    <span>{detailEvent.adminSeoKeywords || 'Belum di-boost oleh Admin'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDetailEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>

              {detailEvent.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => {
                      setRejectModal(detailEvent);
                      setDetailEvent(null);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tolak Event
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(detailEvent.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Setujui & Publikasikan</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Tolak Pengajuan Event</h3>
                <p className="text-xs text-slate-500">{rejectModal.title}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Alasan Penolakan (akan dikirimkan ke Penyelenggara)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Dokumen perizinan venue belum lengkap / informasi harga tidak wajar..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate({
                    id: rejectModal.id,
                    reason: rejectReason || 'Tidak memenuhi kualifikasi persetujuan event platform.',
                  })
                }
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {rejectMutation.isPending ? 'Memproses...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM FORCE UNPUBLISH MODAL */}
      {confirmUnpublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Force Unpublish Event</h3>
                <p className="text-xs text-slate-500">Tindakan Moderasi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menarik tayang event{' '}
              <strong className="text-slate-900">{confirmUnpublishModal.title}</strong>? Event akan
              dikembalikan ke status <strong className="text-slate-900">Draft</strong> dan tidak
              dapat diakses/dibeli tiketnya oleh publik.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmUnpublishModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => unpublishMutation.mutate(confirmUnpublishModal.id)}
                disabled={unpublishMutation.isPending}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {unpublishMutation.isPending ? 'Memproses...' : 'Ya, Tarik Tayang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO DOUBLE ENGAGEMENT BOOSTER MODAL */}
      {seoModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-[#08B4B5] flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Platform SEO Booster
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#08B4B5] border border-teal-200">
                      Double Engagement
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                    {seoModalEvent.title} • {seoModalEvent.organizerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSeoModalEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-emerald-50/80 border border-teal-200/80 rounded-2xl text-xs text-teal-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#08B4B5]" />
                <span>Sinergi Double Engagement:</span>
              </span>
              <p className="text-[11px] text-teal-900 leading-relaxed">
                Gabungkan kata kunci spesifik milik EO dengan kata kunci resmi platform Taqtix untuk melipatgandakan indeks pencarian Google, social share ranking, dan discovery feed rekomendasi.
              </p>
            </div>

            {/* EO Original Target Keywords */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Kunci dari Event Organizer (EO)</span>
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {seoModalEvent.seoKeywords ? (
                  <div className="flex flex-wrap gap-1.5">
                    {seoModalEvent.seoKeywords.split(',').map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 text-[11px] font-medium shadow-2xs"
                      >
                        #{kw.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">
                    EO belum menentukan kata kunci spesifik saat pembuatan event.
                  </span>
                )}
              </div>
            </div>

            {/* Main Admin SEO Booster Keywords Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#08B4B5]" />
                  <span>Platform SEO Booster Keywords (Main Admin)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Pisahkan dengan koma
                </span>
              </div>
              <textarea
                rows={3}
                value={adminKeywordsInput}
                onChange={(e) => setAdminKeywordsInput(e.target.value)}
                placeholder="Contoh: Taqtix Official, Tiket Resmi Jakarta, Promo Spesial, Trending Pekan Ini"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition leading-relaxed font-mono"
              />

              {/* Preset Booster Suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">
                  Preset Booster Cepat (Klik untuk menambah):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Taqtix Official',
                    'Tiket Resmi Jakarta',
                    'Trending Pekan Ini',
                    'Promo Spesial',
                    'Verified Organizer',
                    'Konser Islami',
                    'Pilihan Redaksi',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = adminKeywordsInput
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (!current.includes(tag)) {
                          setAdminKeywordsInput([...current, tag].join(', '));
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-lg text-[10px] font-medium transition cursor-pointer border border-slate-200 hover:border-teal-300"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Tingkat Prioritas Algoritma Pencarian</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['NORMAL', 'HIGH', 'MAX_BOOST'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeoPriorityInput(level)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      seoPriorityInput === level
                        ? 'border-[#08B4B5] bg-teal-50/70 text-teal-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{level}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {level === 'NORMAL' && 'Standar Index'}
                      {level === 'HIGH' && 'Prioritas Tinggi'}
                      {level === 'MAX_BOOST' && 'Super Trending'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Double Engagement Power */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Kekuatan Sinergi Pencarian:</span>
              <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {(seoModalEvent.seoKeywords ? seoModalEvent.seoKeywords.split(',').filter(Boolean).length : 0) +
                    adminKeywordsInput.split(',').filter(Boolean).length}{' '}
                  Total Active Search Index Keys
                </span>
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSeoModalEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  updateSeoMutation.mutate({
                    id: seoModalEvent.id,
                    adminSeoKeywords: adminKeywordsInput,
                    seoPriority: seoPriorityInput,
                  })
                }
                disabled={updateSeoMutation.isPending}
                className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {updateSeoMutation.isPending ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan Booster</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
