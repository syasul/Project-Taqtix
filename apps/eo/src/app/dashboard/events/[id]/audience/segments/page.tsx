'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ArrowRight,
  Filter,
  Ticket,
  MapPin,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Segment {
  id: string;
  name: string;
  criteria: any;
  createdAt: string;
  _count?: {
    members?: number;
  };
}

export default function AudienceSegmentsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [citiesInput, setCitiesInput] = useState('');
  const [hasPreviousPurchase, setHasPreviousPurchase] = useState(false);
  const [previousEventId, setPreviousEventId] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch ticket categories of this event
  const { data: categories = [] } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/ticket-categories`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  // Fetch organizer events for "pernah beli event sebelumnya"
  const { data: allEvents = [] } = useQuery({
    queryKey: ['organizer-events-crm'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

  // Fetch segments for this event
  const { data: segments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery<Segment[]>({
    queryKey: ['event-segments', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/segments`);
      return res.data?.data || [];
    },
    enabled: !!eventId,
  });

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName.trim()) {
      toast.error('Harap isi nama segmen');
      return;
    }

    try {
      setCreating(true);
      const criteria: any = {};
      if (selectedCategories.length > 0) {
        criteria.ticketCategoryIds = selectedCategories;
      }
      if (citiesInput.trim()) {
        criteria.cities = citiesInput.split(',').map(c => c.trim()).filter(Boolean);
      }
      if (hasPreviousPurchase && previousEventId) {
        criteria.hasBoughtEventId = previousEventId;
      }

      const res = await apiClient.post(`/organizer/events/${eventId}/segments`, {
        name: segmentName,
        criteria,
      });

      if (res.data?.success) {
        toast.success('Segmen audiens berhasil dibuat!');
        setIsCreateOpen(false);
        setSegmentName('');
        setSelectedCategories([]);
        setCitiesInput('');
        setHasPreviousPurchase(false);
        setPreviousEventId('');
        refetchSegments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat segmen audiens');
    } finally {
      setCreating(false);
    }
  };

  const otherEvents = allEvents.filter((e: any) => e.id !== eventId);

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Audience Segments & CRM' },
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
            Audience Segments & CRM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Segmentasikan basis pembeli tiket Anda berdasarkan kategori, kota, dan riwayat repeat order untuk penargetan broadcast.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm border-0 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Segmen Baru</span>
        </button>
      </div>

      {segmentsLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat data segmen audiens...</span>
        </div>
      ) : segments.length === 0 ? (
        <Card className="bg-white border-dashed border-2 border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-teal-50 text-[#08B4B5] rounded-2xl flex items-center justify-center mx-auto">
              <Users className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Belum Ada Segmen Dibuat</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buat segmen pertama Anda untuk kelompokkan pembeli VIP, pengunjung luar kota, atau loyal customers untuk kampanye broadcast WhatsApp.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Buat Segmen Sekarang</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {segments.map((seg) => {
            const criteria = seg.criteria || {};
            const categoriesCount = criteria.ticketCategoryIds?.length || 0;
            const citiesCount = criteria.cities?.length || 0;

            return (
              <Card key={seg.id} className="bg-white border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{seg.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Dibuat pada {new Date(seg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="p-2 bg-teal-50 text-[#08B4B5] rounded-xl">
                    <Users className="h-4 w-4" />
                  </span>
                </div>

                {/* Criteria Tags */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {categoriesCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium flex items-center gap-1">
                      <Ticket className="h-3 w-3 text-slate-400" /> {categoriesCount} Kategori
                    </span>
                  )}
                  {citiesCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" /> {citiesCount} Kota
                    </span>
                  )}
                  {criteria.hasBoughtEventId && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-md font-medium flex items-center gap-1">
                      <History className="h-3 w-3 text-purple-500" /> Pernah Beli Event Lalu
                    </span>
                  )}
                  {!categoriesCount && !citiesCount && !criteria.hasBoughtEventId && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                      Semua Pembeli Event
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/dashboard/events/${eventId}/audience/segments/${seg.id}`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>Lihat Detail Member</span>
                  </Link>

                  <Link
                    href={`/dashboard/events/${eventId}/audience/segments/${seg.id}?compose=true`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl transition shadow-2xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>Kirim Broadcast</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Builder: Buat Segmen Baru */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#08B4B5]" />
                Filter Builder Segmen Audiens
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Nama Segmen */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Segmen *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pembeli Tiket VIP Jabodetabek"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Multi-Select Kategori Tiket */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori Tiket Dibeli</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-36 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Belum ada kategori tiket tersedia.</p>
                  ) : (
                    categories.map((cat: any) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <label 
                          key={cat.id} 
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCategory(cat.id)}
                            className="rounded border-slate-300 text-[#08B4B5] focus:ring-[#08B4B5]"
                          />
                          <span className="font-medium">{cat.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Multi-select / Input Kota */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Domisili Kota</label>
                <input
                  type="text"
                  placeholder="Misal: Jakarta, Bandung, Surabaya (pisahkan dengan koma)"
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Kosongkan jika ingin mencakup pembeli dari seluruh kota.
                </p>
              </div>

              {/* Checkbox Pernah Beli Event Sebelumnya */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasPreviousPurchase}
                    onChange={(e) => setHasPreviousPurchase(e.target.checked)}
                    className="rounded border-slate-300 text-[#08B4B5] focus:ring-[#08B4B5]"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Pernah Membeli Event Sebelumnya (Loyalty Retargeting)
                  </span>
                </label>

                {hasPreviousPurchase && (
                  <div className="space-y-1 pl-6">
                    <label className="text-[11px] font-semibold text-slate-600">Pilih Event Sebelumnya</label>
                    <select
                      value={previousEventId}
                      onChange={(e) => setPreviousEventId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih Event Asal --</option>
                      {otherEvents.map((evt: any) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  <span>Simpan Segmen Audiens</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
