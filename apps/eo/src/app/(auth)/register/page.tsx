'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ArrowRight, Lock, Mail, UserCheck } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
  role: z.enum(['buyer', 'organizer', 'partner'], {
    errorMap: () => ({ message: 'Pilih role pendaftaran Anda' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'organizer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', values);
      toast.success('Pendaftaran berhasil! Silakan masuk menggunakan akun Anda.');
      router.push('/login');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registrasi gagal. Coba lagi.';
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
          Registrasi Partner & Organizer
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Daftar Akun Baru
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Mulai publikasikan dan kelola tiket event Anda dalam hitungan menit.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Daftar Sebagai
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'organizer', label: 'Organizer' },
              { value: 'partner', label: 'Affiliate' },
              { value: 'buyer', label: 'Buyer' },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setValue('role', item.value)}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition duration-150 cursor-pointer ${
                  selectedRole === item.value
                    ? 'bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] border-[#08B4B5] text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-rose-400 text-[11px] font-semibold mt-1.5">{errors.role.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
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
          className="w-full py-3 bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] hover:from-[#0abfc0] hover:to-[#0fb5b5] text-slate-950 font-extrabold rounded-xl shadow-lg shadow-[#08B4B5]/20 hover:shadow-[#08B4B5]/35 transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 group text-xs tracking-wider uppercase mt-3 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
          ) : (
            <>
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-950" />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="flex items-center justify-center gap-1.5 border-t border-slate-800/80 pt-6 mt-6 text-xs text-slate-400">
        <span>Sudah memiliki akun?</span>
        <Link
          href="/login"
          className="font-bold text-[#08B4B5] hover:text-[#0abfc0] transition"
        >
          Masuk Disini
        </Link>
      </div>
    </div>
  );
}
