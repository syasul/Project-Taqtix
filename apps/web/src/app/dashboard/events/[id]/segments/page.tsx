'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Users, 
  PlusCircle, 
  MessageSquare, 
  Send, 
  Loader2, 
  X, 
  CheckCircle,
  Eye
} from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  criteria: any;
  createdAt: string;
}

export default function CRMPage() {
  const params = useParams();
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
        setTimeout(() => pollBroadcastStatus(jobId), 1500); // Polling status
      }
    } catch (err) {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <EventTabs eventId={eventId} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            CRM Segmen Audiens & WA Broadcast
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelompokkan pembeli tiket berdasarkan filter, dan kirim pesan promosi / info via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Buat Segmen Baru
        </button>
      </div>

      {segmentsLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Memuat segmen...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Segments List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Daftar Segmen Terdaftar</h3>
            {segments.length === 0 ? (
              <div className="p-12 bg-slate-900/30 border border-slate-850 rounded-2xl text-center text-slate-500 text-xs">
                Belum ada segmen audiens dibuat.
              </div>
            ) : (
              segments.map((seg) => (
                <div key={seg.id} className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-4 hover:border-slate-800 transition">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-200">{seg.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Dibuat: {new Date(seg.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  {/* Criteria Tags */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    {seg.criteria.cities && (
                      <span className="bg-slate-950 border border-slate-900 px-2 py-0.5 rounded">Kota: {seg.criteria.cities.join(', ')}</span>
                    )}
                    {seg.criteria.minPurchaseCount && (
                      <span className="bg-slate-950 border border-slate-900 px-2 py-0.5 rounded">Min Tiket: {seg.criteria.minPurchaseCount}</span>
                    )}
                    {seg.criteria.ticketCategoryIds && (
                      <span className="bg-slate-950 border border-slate-900 px-2 py-0.5 rounded">Kategori: {seg.criteria.ticketCategoryIds.length} Tipe</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => fetchMembersPreview(seg.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-750 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Lihat Anggota
                    </button>
                    <button
                      onClick={() => {
                        setActiveSegmentId(seg.id);
                        setIsBroadcastOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Kirim Broadcast
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Members Preview Panel */}
          <Card className="bg-slate-900/40 border-slate-850 p-6 space-y-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Pratinjau Anggota</CardTitle>
              <CardDescription className="text-xs text-slate-500">Klik &apos;Lihat Anggota&apos; untuk menampilkan detail kontak</CardDescription>
            </div>

            {previewLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            ) : !activePreviewSegment ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Belum ada segmen dipilih.
              </div>
            ) : membersPreview.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                0 Anggota memenuhi kriteria segmen ini.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{membersPreview.length} Kontak Ditemukan</div>
                {membersPreview.map((m) => (
                  <div key={m.email} className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                    <h5 className="text-xs font-bold text-slate-200 truncate">{m.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{m.email}</p>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Buat Segmen Baru
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Segmen</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Loyalis Jabodetabek VIP"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Filter Kota (Pisahkan Koma)</label>
                <input
                  type="text"
                  placeholder="jakarta, bogor, depok"
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Min. Pembelian Tiket</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Min tiket dibeli"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Beli Kategori Tiket (Multiselect)</label>
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  {categories.map((cat: any) => (
                    <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Segmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                Kirim WA Broadcast
              </h3>
              <button
                onClick={() => {
                  setIsBroadcastOpen(false);
                  setBroadcastJobStatus(null);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={triggerBroadcast} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Pesan WA (Gunakan &apos;&#123;name&#125;&apos; untuk personalisasi)</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none placeholder-slate-600"
                />
              </div>

              {broadcastJobStatus && (
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Status Pengiriman</span>
                    <span className="text-indigo-400 font-mono">{broadcastJobStatus.status}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
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
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {broadcasting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Kirim
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
