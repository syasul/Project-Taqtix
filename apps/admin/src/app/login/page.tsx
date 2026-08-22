'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

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
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-zinc-100 text-slate-900 p-4 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-950/5 transition-all duration-300 p-8 relative overflow-hidden">
        {/* Top Decorative Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-red-50/50 text-[10px] font-mono tracking-wider text-red-650 font-bold uppercase mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            TAQtix Administrative Portal
          </div>
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase mt-2 font-sans">
            Platform Gateway
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium max-w-xs mx-auto">
            Gunakan otentikasi kredensial internal & enkripsi MFA untuk mengakses konsol.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-l-red-600 border-y-red-100 border-r-red-100 text-red-700 rounded-r-lg text-xs font-semibold leading-relaxed animate-shake">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@taqtix.id"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/20 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/20 transition-all text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-650 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg shadow-red-500/10 hover:shadow-red-700/20 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Kredensial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-normal">
                Kredensial cocok. Silakan masukkan 6 digit kode dari aplikasi autentikator Anda.
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="mfaCode" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Kode MFA (TOTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-red-600 hover:text-red-500 font-bold uppercase tracking-wider cursor-pointer"
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
                placeholder="000 000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/20 transition-all text-center font-mono tracking-widest text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-650 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg shadow-red-500/10 hover:shadow-red-700/20 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verifikasi & Masuk</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
