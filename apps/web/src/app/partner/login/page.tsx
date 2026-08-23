'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { HeartHandshake, Mail, Send, Loader2 } from 'lucide-react';

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await apiClient.post('/partner/auth/request-magic-link', { email });
      if (res.data?.token) { // token logs in console for local simulation
        setSent(true);
        toast.success('Magic link login dikirim ke email/WhatsApp Anda!');
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'EMAIL_NOT_REGISTERED') {
        toast.error('Email tidak terdaftar sebagai partner afiliasi');
      } else {
        toast.error('Gagal mengirim magic link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <HeartHandshake className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Portal Partner Afiliasi</h2>
          <p className="text-xs text-slate-400">
            Masuk tanpa password menggunakan Tautan Masuk Cepat (Magic Link).
          </p>
        </div>

        {sent ? (
          <div className="p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-center space-y-2">
            <Send className="h-6 w-6 text-indigo-400 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Tautan Terkirim</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Kami telah mengirimkan tautan masuk ke email <strong>{email}</strong>. Periksa kotak masuk atau folder spam Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Terdaftar
              </label>
              <input
                type="email"
                required
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-slate-100 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirim Tautan Masuk
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
