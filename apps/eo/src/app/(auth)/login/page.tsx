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
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react';

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
      const resData = response.data?.data || response.data;
      const { accessToken, refreshToken } = resData;

      setAuth(accessToken, refreshToken);
      toast.success('Login berhasil! Selamat datang kembali.');

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
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-10 relative overflow-hidden text-slate-900">
      {/* Header & Logo */}
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
          Partner & Organizer Portal
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Kelola event, pantau penjualan tiket, dan kembangkan audience Anda.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="organizer@taqtix.id"
              {...register('email')}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs font-semibold transition"
            />
          </div>
          {errors.email && (
            <p className="text-rose-500 text-[11px] font-semibold mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Kata Sandi
            </label>
            <span className="text-[11px] text-[#08B4B5] hover:underline font-semibold cursor-pointer">
              Lupa sandi?
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs font-semibold transition"
            />
          </div>
          {errors.password && (
            <p className="text-rose-500 text-[11px] font-semibold mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-extrabold rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase mt-2 active:scale-[0.99] disabled:opacity-50 border-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-6 mt-6 text-xs text-slate-500">
        <span>Belum memiliki akun Organizer?</span>
        <Link
          href="/register"
          className="font-bold text-[#08B4B5] hover:underline transition"
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
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 flex justify-center items-center rounded-2xl shadow-sm">
          <div className="w-6 h-6 border-2 border-[#08B4B5]/30 border-t-[#08B4B5] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
