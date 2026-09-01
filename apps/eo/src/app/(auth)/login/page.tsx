'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { ArrowRight, Lock, Mail } from 'lucide-react';

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
      const response = await apiClient.post('/auth/login', values);
      const { accessToken, refreshToken } = response.data;

      setAuth(accessToken, refreshToken);
      toast.success('Login berhasil! Selamat datang kembali.');

      router.push(redirectPath);
      router.refresh();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Email atau password salah';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden text-slate-100">
      {/* Top Brand Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#08B4B5] via-[#0DAEAE] to-[#F1B829]" />

      {/* Header & Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="TAQtix Logo"
            width={160}
            height={46}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08B4B5]/30 bg-[#08B4B5]/10 text-[10px] font-mono tracking-wider text-[#08B4B5] font-bold uppercase mb-3 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#08B4B5] animate-pulse" />
          Partner & Organizer Portal
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Kelola event, pantau penjualan tiket, dan kembangkan audience Anda.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="organizer@taqtix.id"
              {...register('email')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#08B4B5] focus:bg-slate-900 focus:ring-1 focus:ring-[#08B4B5]/30 transition-all text-xs font-semibold"
            />
          </div>
          {errors.email && (
            <p className="text-rose-400 text-[11px] font-semibold mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kata Sandi
            </label>
            <span className="text-[11px] text-[#08B4B5] hover:text-[#0abfc0] font-semibold cursor-pointer">
              Lupa sandi?
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#08B4B5] focus:bg-slate-900 focus:ring-1 focus:ring-[#08B4B5]/30 transition-all text-xs font-semibold"
            />
          </div>
          {errors.password && (
            <p className="text-rose-400 text-[11px] font-semibold mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] hover:from-[#0abfc0] hover:to-[#0fb5b5] text-slate-950 font-extrabold rounded-xl shadow-lg shadow-[#08B4B5]/20 hover:shadow-[#08B4B5]/35 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase mt-2 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
          ) : (
            <>
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-950" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono">
          <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-widest">Atau masuk dengan</span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => {
          toast.info('Menghubungkan ke otentikasi Google SSO...');
        }}
        className="w-full flex items-center justify-center gap-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700/80 text-slate-200 font-bold rounded-xl py-3 cursor-pointer transition shadow-sm text-xs"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99C6.18 7.35 8.85 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.91 3.41-8.6z"
          />
          <path
            fill="#FBBC05"
            d="M5.25 14.84c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.4 7.23C.51 9.01 0 11 0 13.12s.51 4.11 1.4 5.89l3.85-3.17z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.02.68-2.33 1.09-3.93 1.09-3.15 0-5.82-2.31-6.77-5.51l-3.85 3c1.97 3.91 5.95 6.56 10.77 6.56z"
          />
        </svg>
        <span>Masuk dengan Google</span>
      </button>

      {/* Footer link */}
      <div className="flex items-center justify-center gap-1.5 border-t border-slate-800/80 pt-6 mt-6 text-xs text-slate-400">
        <span>Belum memiliki akun Organizer?</span>
        <Link
          href="/register"
          className="font-bold text-[#08B4B5] hover:text-[#0abfc0] transition"
        >
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 flex justify-center items-center rounded-2xl">
          <div className="w-6 h-6 border-2 border-[#08B4B5]/30 border-t-[#08B4B5] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
