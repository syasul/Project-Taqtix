'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { HeartHandshake, Mail, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      // Panggil endpoint BE
      await apiClient.post('/partner/auth/request-magic-link', { email: email.trim() });
    } catch (err: any) {
      // Selalu tangkap secara senyap untuk mencegah enumerasi email
      console.warn('Request magic link dispatch:', err);
    } finally {
      // Keamanan: Response dan UI selalu sama persis baik email terdaftar maupun tidak
      setLoading(false);
      setSubmitted(true);
      toast.success('Permintaan tautan masuk telah diproses');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-800 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#08B4B5]">
            <HeartHandshake className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Portal Mitra Afiliasi TAQtix
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Masuk tanpa kata sandi menggunakan Tautan Masuk Cepat (Magic Link).
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-[#08B4B5] mx-auto animate-pulse" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">Cek email/WA kamu untuk link login</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika email Anda terdaftar sebagai mitra partner terverifikasi, kami telah mengirimkan tautan masuk instan. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="text-xs font-bold text-[#08B4B5] hover:underline cursor-pointer"
              >
                Gunakan alamat email lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="partner-email" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Alamat Email Partner
              </label>
              <Input
                id="partner-email"
                type="email"
                required
                placeholder="nama@mitra.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer border-0 h-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span>Kirim Tautan Masuk</span>
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
