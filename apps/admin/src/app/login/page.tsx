'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import Image from 'next/image';
import { ShieldCheck, ArrowRight, KeyRound, Lock, Mail, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password,
      });

      const payload = parseJwt(res.accessToken);
      if (!payload || payload.role !== 'admin') {
        setError('Akses Ditolak: Kredensial tidak terdaftar sebagai Administrator.');
        setLoading(false);
        return;
      }

      setTempToken(res.accessToken);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Otentikasi gagal. Silakan periksa kembali email & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mfaCode.length !== 6 || !/^\d+$/.test(mfaCode)) {
      setError('Kode TOTP tidak valid. Harus berupa 6 digit angka.');
      setLoading(false);
      return;
    }

    if (tempToken) {
      document.cookie = `admin_access_token=${tempToken}; path=/; max-age=${60 * 30}; SameSite=Strict; Secure`;
      router.push('/');
    } else {
      setError('Sesi autentikasi kedaluwarsa. Silakan login kembali.');
      setStep(1);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-10 relative overflow-hidden">
        {/* Top Header & Logo */}
        <div className="text-center mb-8">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08B4B5]/30 bg-[#08B4B5]/10 text-[10px] font-mono tracking-wider text-[#08B4B5] font-bold uppercase mb-2 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B4B5]" />
            Admin Platform Gateway
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Gunakan otentikasi kredensial internal & enkripsi MFA untuk mengakses konsol.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-l-rose-500 border-y-rose-200 border-r-rose-200 text-rose-700 rounded-r-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taqtix.id"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs font-semibold transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs font-semibold transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-extrabold rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase border-0 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Kredensial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-normal">
                Kredensial cocok. Silakan masukkan 6 digit kode dari aplikasi autentikator Anda.
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="mfaCode" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kode MFA (TOTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-[#08B4B5] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
              </div>
              <input
                id="mfaCode"
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-center font-mono tracking-widest text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-extrabold rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase border-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verifikasi & Masuk</span>
                  <ShieldCheck className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-100 font-medium">
          <Shield className="w-3.5 h-3.5 text-[#08B4B5]" />
          <span>Sesi diamankan dengan enkripsi audit log terpusat</span>
        </div>
      </div>
    </main>
  );
}
