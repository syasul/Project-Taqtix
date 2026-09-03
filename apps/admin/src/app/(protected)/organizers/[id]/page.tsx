'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Building2,
  Info,
  Loader2,
  Save,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  plan: 'starter' | 'pro' | 'enterprise';
  segment: 'event_builder' | 'event_ip_owner' | 'campus_community' | 'enterprise' | null;
  bankAccount?: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  eventCount: number;
}

export default function OrganizerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [segment, setSegment] = useState<string>('event_builder');
  const [plan, setPlan] = useState<string>('starter');
  const [bankAccount, setBankAccount] = useState('');

  // Fetch organizer details
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ['admin-organizers'],
    queryFn: () => api.get<Organizer[]>('/admin/organizers'),
  });

  const org = organizers.find((o) => o.id === id);

  useEffect(() => {
    if (org) {
      setName(org.name || '');
      setPhone(org.phone || '');
      setSegment(org.segment || 'event_builder');
      setPlan(org.plan || 'starter');
      setBankAccount(org.bankAccount || '');
    }
  }, [org]);

  const saveMutation = useMutation({
    mutationFn: (data: {
      name: string;
      phone: string;
      segment: string;
      plan: string;
      bankAccount: string;
    }) => api.patch(`/admin/organizers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      toast.success('Pengaturan organizer berhasil disimpan');
      router.push('/organizers');
    },
    onError: () => {
      toast.error('Gagal memperbarui pengaturan organizer');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ name, phone, segment, plan, bankAccount });
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
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat data organizer...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 max-w-md mx-auto">
        <p className="text-slate-700 text-sm font-bold">Organizer tidak ditemukan.</p>
        <button
          onClick={() => router.push('/organizers')}
          className="mt-4 text-xs font-bold text-[#08B4B5] hover:underline flex items-center gap-1 mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Organizer
        </button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Manajemen Organizer', href: '/organizers' },
    { label: org.name },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#08B4B5]" />
            Konfigurasi & Detail Organizer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan profil, tier layanan, dan informasi rekening untuk: <strong className="text-slate-800">{org.name}</strong>
          </p>
        </div>

        <button
          onClick={() => router.push('/organizers')}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Info Card Summary */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">ID Organizer</span>
            <span className="font-mono font-bold text-slate-700">{org.id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Email Utama</span>
            <span className="font-semibold text-slate-800">{org.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Status Akun</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {org.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Informasi Umum Organisasi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Nama Organisasi / EO *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tiering & Segmentation */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#08B4B5]" />
            Segmentasi & Paket Layanan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Customer Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
              >
                <option value="event_builder">Event Builder (Standard)</option>
                <option value="event_ip_owner">Event IP Owner (Festival/Tahunan)</option>
                <option value="campus_community">Campus & Community</option>
                <option value="enterprise">Enterprise (Korporat)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Batasan Layanan (Plan)
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white cursor-pointer"
              >
                <option value="starter">Starter Plan (Fitur dasar)</option>
                <option value="pro">Pro Plan (Multi-user & Workforce Lite)</option>
                <option value="enterprise">Enterprise Plan (SLA tinggi & kustom)</option>
              </select>
            </div>
          </div>

          {/* Tooltip Description */}
          <div className="p-3 bg-teal-50/50 border border-[#08B4B5]/20 rounded-xl flex items-start gap-2.5 text-[11px] text-teal-800 leading-normal">
            <Info className="h-4 w-4 shrink-0 text-[#08B4B5] mt-0.5" />
            <span>{segmentInfo[segment as keyof typeof segmentInfo]}</span>
          </div>
        </div>

        {/* Payout Bank Info */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#08B4B5]" />
            Rekening Bank Payout
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Info Rekening Bank
            </label>
            <input
              type="text"
              placeholder="Contoh: BCA 8891234455 a.n PT Kreasi Nada"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#08B4B5] focus:bg-white"
            />
          </div>
        </div>

        {/* Form Action */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/organizers')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors border-0"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
