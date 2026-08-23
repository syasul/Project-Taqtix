'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ArrowLeft, Shield, Info, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  plan: 'starter' | 'pro' | 'enterprise';
  segment: 'event_builder' | 'event_ip_owner' | 'campus_community' | 'enterprise' | null;
  createdAt: string;
}

export default function OrganizerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [segment, setSegment] = useState<string>('event_builder');
  const [plan, setPlan] = useState<string>('starter');
  const [saving, setSaving] = useState(false);

  // Fetch organizer details (we fetch all and filter for ease of reuse)
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ['admin-organizers'],
    queryFn: () => api.get<Organizer[]>('/admin/organizers'),
  });

  const org = organizers.find((o) => o.id === id);

  useEffect(() => {
    if (org) {
      setSegment(org.segment || 'event_builder');
      setPlan(org.plan || 'starter');
    }
  }, [org]);

  const saveMutation = useMutation({
    mutationFn: (data: { segment: string; plan: string }) =>
      api.patch(`/admin/organizers/${id}/segment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      toast.success('Pengaturan segment dan plan berhasil disimpan');
      router.push('/organizers');
    },
    onError: () => {
      toast.error('Gagal memperbarui pengaturan organizer');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ segment, plan });
  };

  const segmentInfo = {
    event_builder: 'Event Builder: EO reguler, volume kecil-menengah, kebutuhan fitur standar.',
    event_ip_owner: 'Event IP Owner: EO dengan event berulang/festival tahunan, fokus retensi audience.',
    campus_community: 'Campus & Community: EO berbasis kampus/komunitas, volume besar tapi sensitif biaya.',
    enterprise: 'Enterprise: Korporat/EO raksasa, SLA tinggi & request fitur kustom.',
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat data organizer...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm">Organizer tidak ditemukan.</p>
        <button onClick={() => router.push('/organizers')} className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/organizers')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Organizer
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" />
          Ubah Segment & Layanan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan profil segmentasi customer dan batasan plan langganan untuk: <strong>{org.name}</strong>
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        {/* Info Card */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Organisasi</span>
            <span className="font-semibold text-slate-800">{org.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email Utama</span>
            <span className="font-semibold text-slate-800">{org.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status Akun</span>
            <span className="font-semibold text-slate-800 capitalize">{org.status}</span>
          </div>
        </div>

        {/* Segment Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Customer Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-red-500"
          >
            <option value="event_builder">Event Builder</option>
            <option value="event_ip_owner">Event IP Owner</option>
            <option value="campus_community">Campus & Community</option>
            <option value="enterprise">Enterprise</option>
          </select>
          
          {/* Tooltip Description */}
          <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-2 text-[11px] text-red-700 leading-normal">
            <Info className="h-4 w-4 shrink-0 text-red-500" />
            <span>{segmentInfo[segment as keyof typeof segmentInfo]}</span>
          </div>
        </div>

        {/* Plan Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Batasan Layanan (Plan)</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-red-500"
          >
            <option value="starter">Starter Plan (Fitur dasar)</option>
            <option value="pro">Pro Plan (Multi-user & Workforce Lite)</option>
            <option value="enterprise">Enterprise Plan (SLA tinggi & kustom)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-650 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
