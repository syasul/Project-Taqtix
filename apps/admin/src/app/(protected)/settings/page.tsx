'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

interface GuestCheckoutSettingResponse {
  enabled: boolean;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<GuestCheckoutSettingResponse>({
    queryKey: ['admin-guest-checkout-setting'],
    queryFn: () => api.get<GuestCheckoutSettingResponse>('/admin/settings/guest-checkout'),
  });

  const isGuestCheckoutEnabled = data?.enabled ?? true;

  const toggleMutation = useMutation({
    mutationFn: (newVal: boolean) =>
      api.patch('/admin/settings/guest-checkout', { enabled: newVal }),
    onMutate: async (newVal) => {
      await queryClient.cancelQueries({ queryKey: ['admin-guest-checkout-setting'] });
      const prev = queryClient.getQueryData<GuestCheckoutSettingResponse>([
        'admin-guest-checkout-setting',
      ]);
      queryClient.setQueryData(['admin-guest-checkout-setting'], { enabled: newVal });
      return { prev };
    },
    onError: (err: any, _newVal, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['admin-guest-checkout-setting'], context.prev);
      }
      toast.error(err?.message || 'Gagal memperbarui pengaturan fitur.');
    },
    onSuccess: (res: any, newVal) => {
      queryClient.invalidateQueries({ queryKey: ['admin-guest-checkout-setting'] });
      toast.success(
        newVal
          ? 'Fitur Guest Checkout EO berhasil DIAKTIFKAN. EO kini dapat mengatur izin pembelian tanpa login per event.'
          : 'Fitur Guest Checkout EO berhasil DINONAKTIFKAN. Seluruh pembelian tiket kini diwajibkan login akun dan pengaturan disembunyikan dari EO.',
      );
    },
  });

  const handleToggle = () => {
    if (toggleMutation.isPending) return;
    toggleMutation.mutate(!isGuestCheckoutEnabled);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#08B4B5]" />
          Pengaturan Sistem & Fitur Platform
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola feature flags global, kontrol hak akses fitur Event Organizer, dan kebijakan platform TAQtix.
        </p>
      </div>

      {/* Main Settings Card: Fitur Guest Checkout EO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-[#08B4B5]">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Fitur Pembelian Tiket Tanpa Login (Guest Checkout) untuk EO
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed pt-1">
              Atur apakah Event Organizer (EO) diperbolehkan mengatur fitur pembelian tiket tanpa login (guest checkout) pada masing-masing event mereka.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[#08B4B5] animate-spin" />
            ) : (
              <button
                type="button"
                role="switch"
                aria-checked={isGuestCheckoutEnabled}
                onClick={handleToggle}
                disabled={toggleMutation.isPending}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isGuestCheckoutEnabled ? 'bg-[#08B4B5]' : 'bg-slate-300'
                } ${toggleMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isGuestCheckoutEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Current State Indicator Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
            isGuestCheckoutEnabled
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          {isGuestCheckoutEnabled ? (
            <Unlock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                Status Fitur:{' '}
                {isGuestCheckoutEnabled
                  ? 'AKTIF (EO Bebas Mengatur)'
                  : 'NONAKTIF (Wajib Login Seluruh Event)'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isGuestCheckoutEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {isGuestCheckoutEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {isGuestCheckoutEnabled
                ? 'Pada dashboard seluruh EO, switch opsi "Wajibkan Pengunjung Login (Require Login)" DITAMPILKAN. EO dapat mengaktifkan atau menonaktifkan kebutuhan login per event sesuai kebutuhan mereka.'
                : 'Pada dashboard seluruh EO, switch opsi "Wajibkan Pengunjung Login" DISEMBUNYIKAN (fitur tidak ada). Sistem secara otomatis mewajibkan semua calon pembeli tiket di TAQtix untuk login akun sebelum checkout.'}
            </p>
          </div>
        </div>

        {/* Comparison / Explanation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card ON */}
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
              isGuestCheckoutEnabled
                ? 'bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-200'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ketika Fitur Di-ON-kan (Default):</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed pl-1">
              <li>Menu on/off muncul di dashboard EO saat buat atau edit event.</li>
              <li>EO yang mematikan wajib login memperbolehkan pembeli beli tiket tanpa registrasi akun.</li>
              <li>Memberikan fleksibilitas penuh kepada organizer event.</li>
            </ul>
          </div>

          {/* Card OFF */}
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
              !isGuestCheckoutEnabled
                ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Ketika Fitur Di-OFF-kan (Strict Mode):</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed pl-1">
              <li>Menu on/off disembunyikan sepenuhnya dari form buat/edit event EO.</li>
              <li>Semua event di platform otomatis mewajibkan pembeli memiliki akun/login.</li>
              <li>Meningkatkan validitas data pembeli dan mencegah order anonim secara ketat.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Card: Core Platform Architecture */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Server className="w-4 h-4 text-slate-500" />
          <span>Informasi Sistem & Keamanan Platform</span>
        </div>
        <p className="leading-relaxed">
          Perubahan pengaturan ini berlaku secara real-time di seluruh infrastruktur TAQtix (API Backend, Dashboard Organizer, dan Web Frontend Pembeli). Setiap perubahan dicatat ke dalam log audit admin demi keamanan dan akuntabilitas.
        </p>
      </div>
    </div>
  );
}
