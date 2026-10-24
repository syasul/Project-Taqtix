'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  TicketPercent,
  Banknote,
  TrendingUp,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

function AffiliateLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams?.get('redirect');
  const redirectPath = (!rawRedirect || rawRedirect === '/dashboard') ? '/' : rawRedirect;

  const [email, setEmail] = useState('affiliate@taqtix.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('affiliate_auth_token', 'mock-affiliate-token');
      toast.success('Login berhasil! Selamat datang di Portal Mitra Afiliasi.');
      router.push(redirectPath);
      router.refresh();
    }, 600);
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-10 relative overflow-hidden text-slate-900">
      {/* Header & Logo */}
      <div className="text-center mb-7">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="TAQtix Logo"
            width={160}
            height={46}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#08B4B5]/30 bg-[#08B4B5]/10 text-[10px] font-mono tracking-wider text-[#08B4B5] font-extrabold uppercase mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#08B4B5]" />
          <span>PORTAL MITRA AFILIASI & INFLUENCER</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
          Masuk Akun Afiliasi
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
          Kelola kode promo per event, pantau penjualan tiket audiens Anda, dan tarik saldo komisi secara real-time.
        </p>
      </div>

      {/* 3 Pillar Badges */}
      <div className="grid grid-cols-3 gap-2 mb-6 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-[10px]">
        <div className="space-y-0.5">
          <span className="font-bold text-[#08B4B5] block">Kode Unik</span>
          <span className="text-slate-400">Tiap Event</span>
        </div>
        <div className="space-y-0.5 border-x border-slate-200">
          <span className="font-bold text-emerald-600 block">Komisi Cair</span>
          <span className="text-slate-400">1x24 Jam</span>
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 block">Real-Time</span>
          <span className="text-slate-400">Tracking Tiket</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Alamat Email Afiliasi
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@partner.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition text-xs font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Kata Sandi
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[11px] font-bold text-[#08B4B5] hover:underline cursor-pointer border-0 bg-transparent p-0"
            >
              Lupa sandi?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition text-xs font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-4 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi...</span>
            </>
          ) : (
            <>
              <span>MASUK DASHBOARD AFILIASI</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer info */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        Belum terdaftar sebagai mitra affiliator?{' '}
        <a
          href="mailto:partner@taqtix.id"
          className="font-bold text-[#08B4B5] hover:underline inline-block"
        >
          Daftar Program Afiliasi
        </a>
      </div>

      {/* Modal Lupa Sandi */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#08B4B5] flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset Sandi Afiliasi
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Untuk keamanan pencairan komisi dan tautan unik Anda, reset kata sandi akun Afiliasi dapat dikonfirmasi via CS TAQtix.
            </p>

            <div className="space-y-2.5">
              <a
                href="https://wa.me/6281283626210?text=Halo%20Admin%20TAQtix,%20saya%20ingin%20meminta%20reset%20kata%20sandi%20akun%20Mitra%20Afiliasi%20TAQtix"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi CS via WhatsApp</span>
              </a>

              <a
                href="mailto:partner@taqtix.id?subject=Permintaan%20Reset%20Password%20Akun%20Afiliasi"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Mail className="w-4 h-4" />
                <span>Kirim Email ke partner@taqtix.id</span>
              </a>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AffiliateLoginPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
          </div>
        }
      >
        <AffiliateLoginForm />
      </Suspense>
    </div>
  );
}
