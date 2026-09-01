'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import Image from 'next/image';
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
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-4 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#08B4B5]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#F1B829]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden text-slate-100">
        {/* Top Decorative Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#08B4B5] via-[#0DAEAE] to-[#F1B829]" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08B4B5]/30 bg-[#08B4B5]/10 text-[10px] font-mono tracking-wider text-[#08B4B5] font-bold uppercase mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B4B5] animate-pulse" />
            Admin Platform Gateway
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium max-w-xs mx-auto">
            Gunakan otentikasi kredensial internal & enkripsi MFA untuk mengakses konsol.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border-l-4 border-l-red-500 border-y-red-900/50 border-r-red-900/50 text-red-300 rounded-r-lg text-xs font-semibold leading-relaxed animate-shake">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@taqtix.id"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#08B4B5] focus:bg-slate-900 focus:ring-1 focus:ring-[#08B4B5]/30 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#08B4B5] focus:bg-slate-900 focus:ring-1 focus:ring-[#08B4B5]/30 transition-all text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] hover:from-[#0abfc0] hover:to-[#0fb5b5] text-slate-950 font-extrabold rounded-lg shadow-md hover:shadow-lg shadow-[#08B4B5]/20 hover:shadow-[#08B4B5]/30 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Kredensial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-950" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-[#F1B829] shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-normal">
                Kredensial cocok. Silakan masukkan 6 digit kode dari aplikasi autentikator Anda.
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="mfaCode" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kode MFA (TOTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-[#08B4B5] hover:text-[#0abfc0] font-bold uppercase tracking-wider cursor-pointer"
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
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#08B4B5] focus:bg-slate-900 focus:ring-1 focus:ring-[#08B4B5]/30 transition-all text-center font-mono tracking-widest text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] hover:from-[#0abfc0] hover:to-[#0fb5b5] text-slate-950 font-extrabold rounded-lg shadow-md hover:shadow-lg shadow-[#08B4B5]/20 hover:shadow-[#08B4B5]/30 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verifikasi & Masuk</span>
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
