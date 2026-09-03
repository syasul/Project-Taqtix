'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { 
  Users, 
  PlusCircle, 
  MessageSquare, 
  Send, 
  Loader2, 
  X, 
  CheckCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Segment {
  id: string;
  name: string;
  criteria: any;
  createdAt: string;
}

export default function CRMPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [citiesInput, setCitiesInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('Halo {name}, jangan lewatkan konser religi kami!');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastJobStatus, setBroadcastJobStatus] = useState<any>(null);

  // Fetch ticket categories
  const { data: categories = [] } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/ticket-categories`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  // Fetch segments
  const { data: segments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery<Segment[]>({
    queryKey: ['event-segments', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/segments`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  // Members Preview list
  const [activePreviewSegment, setActivePreviewSegment] = useState<string | null>(null);
  const [membersPreview, setMembersPreview] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchMembersPreview = async (segmentId: string) => {
    try {
      setPreviewLoading(true);
      setActivePreviewSegment(segmentId);
      const res = await apiClient.get(`/organizer/segments/${segmentId}/members`);
      if (res.data?.success) {
        setMembersPreview(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat anggota segmen');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName) return;

    try {
      setCreating(true);
      const criteria: any = {};
      if (selectedCategories.length > 0) {
        criteria.ticketCategoryIds = selectedCategories;
      }
      if (citiesInput) {
        criteria.cities = citiesInput.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
      }
      if (minPurchase) {
        criteria.minPurchaseCount = parseInt(minPurchase, 10);
      }

      const res = await apiClient.post(`/organizer/events/${eventId}/segments`, {
        name: segmentName,
        criteria,
      });

      if (res.data?.success) {
        toast.success('Segmen audiens berhasil dibuat');
        setIsCreateOpen(false);
        setSegmentName('');
        setMinPurchase('');
        setCitiesInput('');
        setSelectedCategories([]);
        refetchSegments();
      }
    } catch (err) {
      toast.error('Gagal membuat segmen');
    } finally {
      setCreating(false);
    }
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const triggerBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBroadcasting(true);
      const res = await apiClient.post(`/organizer/segments/${activeSegmentId}/broadcast`, {
        message: broadcastMessage,
      });

      if (res.data?.success) {
        toast.success('WhatsApp Broadcast mulai diproses');
        const jobId = res.data.data.jobId;
        pollBroadcastStatus(jobId);
      }
    } catch (err) {
      toast.error('Gagal memulai broadcast');
      setBroadcasting(false);
    }
  };

  const pollBroadcastStatus = async (jobId: string) => {
    try {
      const res = await apiClient.get(`/organizer/broadcasts/${jobId}/status`);
      setBroadcastJobStatus(res.data.data);

      if (res.data.data.status === 'completed' || res.data.data.status === 'failed') {
        toast.success('Broadcast selesai dikirim!');
        setBroadcasting(false);
      } else {
        setTimeout(() => pollBroadcastStatus(jobId), 1500);
      }
    } catch (err) {
      setBroadcasting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'CRM & WA Broadcast' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#08B4B5]" />
            CRM Segmen Audiens & WA Broadcast
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelompokkan pembeli tiket berdasarkan filter, dan kirim pesan promosi / info via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Segmen Baru</span>
        </button>
      </div>

      {segmentsLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat segmen...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segments List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Daftar Segmen Terdaftar</h3>
            {segments.length === 0 ? (
              <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs shadow-sm">
                Belum ada segmen audiens dibuat.
              </div>
            ) : (
              segments.map((seg) => (
                <div key={seg.id} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{seg.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Dibuat: {new Date(seg.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  {/* Criteria Tags */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-600">
                    {seg.criteria.cities && (
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">Kota: {seg.criteria.cities.join(', ')}</span>
                    )}
                    {seg.criteria.minPurchaseCount && (
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">Min Tiket: {seg.criteria.minPurchaseCount}</span>
                    )}
                    {seg.criteria.ticketCategoryIds && (
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">Kategori: {seg.criteria.ticketCategoryIds.length} Tipe</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => fetchMembersPreview(seg.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Lihat Anggota</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSegmentId(seg.id);
                        setIsBroadcastOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer border-0 shadow-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Kirim Broadcast</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Members Preview Panel */}
          <Card className="bg-white border-slate-200 p-6 space-y-4 rounded-2xl shadow-sm h-fit">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Pratinjau Anggota</CardTitle>
              <CardDescription className="text-xs text-slate-400">Klik &apos;Lihat Anggota&apos; untuk menampilkan detail kontak</CardDescription>
            </div>

            {previewLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 text-[#08B4B5] animate-spin" />
              </div>
            ) : !activePreviewSegment ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada segmen dipilih.
              </div>
            ) : membersPreview.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                0 Anggota memenuhi kriteria segmen ini.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-[#08B4B5] uppercase tracking-widest">{membersPreview.length} Kontak Ditemukan</div>
                {membersPreview.map((m) => (
                  <div key={m.email} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{m.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{m.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{m.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#08B4B5]" />
                Buat Segmen Baru
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Segmen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Loyalis Jabodetabek VIP"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Kota (Pisahkan Koma)</label>
                <input
                  type="text"
                  placeholder="jakarta, bogor, depok"
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min. Pembelian Tiket</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Min tiket dibeli"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Beli Kategori Tiket (Multiselect)</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {categories.map((cat: any) => (
                    <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-white">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded border-slate-300 text-[#08B4B5] focus:ring-0"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm border-0"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Segmen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#08B4B5]" />
                Kirim WA Broadcast
              </h3>
              <button
                onClick={() => {
                  setIsBroadcastOpen(false);
                  setBroadcastJobStatus(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={triggerBroadcast} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pesan WA (Gunakan &#123;name&#125; untuk nama penerima)</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              {broadcastJobStatus && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Status Pengiriman</span>
                    <span className="text-[#08B4B5] font-mono">{broadcastJobStatus.status}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#08B4B5] h-full transition-all duration-300"
                      style={{ 
                        width: `${broadcastJobStatus.targetCount > 0 
                          ? ((broadcastJobStatus.sent + broadcastJobStatus.failed) / broadcastJobStatus.targetCount) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Selesai: {broadcastJobStatus.sent}</span>
                    <span>Gagal: {broadcastJobStatus.failed}</span>
                    <span>Target: {broadcastJobStatus.targetCount}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsBroadcastOpen(false);
                    setBroadcastJobStatus(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm border-0"
                >
                  {broadcasting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
