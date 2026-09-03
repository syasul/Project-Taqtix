'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  KeyRound,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccessMsg('Password Anda berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Pengaturan' },
    { label: 'Ubah Password' },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <KeyRound className="h-6 w-6 text-[#08B4B5]" />
          Keamanan Akun & Ubah Password
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data organisasi.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Gunakan password baru ini untuk login berikutnya.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Password Saat Ini *
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password lama"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[#08B4B5]" />
              Password Baru (Minimal 6 karakter) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Masukkan password baru yang kuat"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Konfirmasi Password Baru *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer border-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>Perbarui Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
