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
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Alamat email tidak valid' }),
    password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
    confirmPassword: z.string().min(6, { message: 'Konfirmasi kata sandi minimal 6 karakter' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuth((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. Panggil endpoint register dengan role: 'buyer'
      await apiClient.post('/auth/register', {
        email: values.email,
        password: values.password,
        role: 'buyer',
      });

      // 2. Lakukan auto-login langsung
      const loginRes = await apiClient.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      const resData = loginRes.data?.data || loginRes.data;
      const { accessToken, refreshToken } = resData;

      if (accessToken && refreshToken) {
        setAuth(accessToken, refreshToken);
        toast.success('Pendaftaran berhasil! Selamat datang di TAQtix.');
        router.push(redirectPath);
        router.refresh();
      } else {
        toast.success('Akun berhasil didaftarkan. Silakan masuk.');
        router.push(`/login${searchParams?.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`);
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Gagal mendaftarkan akun baru. Pastikan email belum pernah terdaftar.';
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
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Buat Akun TAQtix
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Daftar untuk memesan tiket event, menerima notifikasi acara, dan kemudahan check-in.
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:ring-2 focus:ring-[#08B4B5]/20 transition-all text-xs font-medium"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                {...register('password')}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:ring-2 focus:ring-[#08B4B5]/20 transition-all text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi"
                {...register('confirmPassword')}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:ring-2 focus:ring-[#08B4B5]/20 transition-all text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1.5">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
            Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi platform TAQtix.
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
                <span>Daftar Akun Baru</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
              </>
            )}
          </Button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-100 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Data dan informasi akun Anda aman bersama TAQtix</span>
        </div>

        {/* Footer Link */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 mt-4">
          <span>Sudah memiliki akun?</span>
          <Link
            href={`/login${searchParams?.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
            className="font-bold text-[#08B4B5] hover:text-[#099e9f] transition"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white border border-slate-200 p-12 flex justify-center items-center rounded-3xl shadow-sm">
            <div className="w-6 h-6 border-2 border-[#08B4B5]/30 border-t-[#08B4B5] rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
