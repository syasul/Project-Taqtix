'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Ticket, HelpCircle, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuth((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      const resData = response.data?.data || response.data;
      const { accessToken, refreshToken } = resData;

      if (!accessToken || !refreshToken) {
        throw new Error('Token otentikasi tidak ditemukan.');
      }

      setAuth(accessToken, refreshToken);
      const userRole = useAuth.getState().user?.role || resData.user?.role;
      toast.success('Login berhasil! Selamat datang di TAQtix.');

      if (userRole === 'organizer' && (!searchParams?.get('redirect') || searchParams.get('redirect') === '/dashboard')) {
        const eoUrl = process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/dashboard';
        window.location.href = eoUrl;
        return;
      }

      if (userRole === 'admin' && (!searchParams?.get('redirect') || searchParams.get('redirect') === '/dashboard')) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002/admin';
        window.location.href = adminUrl;
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Email atau kata sandi yang Anda masukkan salah.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-10 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-[#08B4B5] mb-4">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Masuk ke TAQtix
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Masuk untuk mengakses e-ticket, menyelesaikan pemesanan, dan mengelola tiket Anda.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-[#08ADAE] transition-colors text-xs font-medium"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-[#08B4B5] hover:underline font-semibold cursor-pointer border-0 bg-transparent p-0"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-[#08ADAE] transition-colors text-xs font-medium"
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
            {errors.password && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1.5">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold rounded-xl transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase mt-4 active:scale-[0.99] disabled:opacity-50 h-auto border-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
              </>
            )}
          </Button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-100 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Keamanan akun & transaksi terlindungi enkripsi 256-bit</span>
        </div>

        {/* Footer Link */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 mt-4">
          <span>Belum punya akun TAQtix?</span>
          <Link
            href={`/register${searchParams?.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
            className="font-bold text-[#08B4B5] hover:text-[#099e9f] transition"
          >
            Daftar Akun
          </Link>
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
                Bantuan Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Untuk keamanan e-ticket dan transaksi Anda, silakan hubungi tim Customer Support TAQtix untuk verifikasi dan pemulihan akun.
              </p>

              <div className="space-y-2.5">
                <a
                  href="https://wa.me/6281283626210?text=Halo%20Admin%20TAQtix,%20saya%20ingin%20meminta%20reset%20kata%20sandi%20akun%20TAQtix%20saya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi CS via WhatsApp</span>
                </a>

                <a
                  href="mailto:support@taqtix.id?subject=Permintaan%20Reset%20Password%20Akun%20TAQtix"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim Email ke support@taqtix.id</span>
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white border border-slate-200 p-12 flex justify-center items-center rounded-3xl shadow-sm">
            <div className="w-6 h-6 border-2 border-[#08B4B5]/30 border-t-[#08B4B5] rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
