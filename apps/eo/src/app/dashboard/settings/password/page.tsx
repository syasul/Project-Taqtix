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

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <KeyRound className="h-6 w-6" />
          </div>
          Keamanan Akun & Ubah Password
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data organisasi.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <p className="text-[11px] text-emerald-500 mt-0.5">
              Gunakan password baru ini untuk login berikutnya.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password lama"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-850">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
              Password Baru (Minimal 6 karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Masukkan password baru yang kuat"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Perbarui Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
