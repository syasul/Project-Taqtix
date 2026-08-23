'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function PartnerVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : null;
  const { setAuth } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('failed');
        return;
      }

      try {
        const res = await apiClient.post('/partner/auth/verify-magic-link', { token });
        if (res.data?.success) {
          const { accessToken, refreshToken } = res.data.data;
          setAuth(accessToken, refreshToken);
          setStatus('success');
          toast.success('Login partner berhasil!');
          
          setTimeout(() => {
            router.push('/partner/dashboard');
          }, 1500);
        }
      } catch (err) {
        setStatus('failed');
        toast.error('Token tidak valid atau kedaluwarsa');
      }
    };

    verify();
  }, [token, setAuth, router]);

  if (status === 'verifying') {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Memverifikasi Tautan Masuk</h2>
        <p className="text-sm text-slate-400">Harap tunggu sementara kami memverifikasi akun Anda...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-450 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Login Berhasil!</h2>
        <p className="text-sm text-slate-450">Mengarahkan Anda ke Dashboard Partner...</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
      <h2 className="text-xl font-bold text-slate-100">Verifikasi Gagal</h2>
      <p className="text-sm text-slate-400">Tautan masuk Anda tidak valid, kedaluwarsa, atau telah digunakan.</p>
      <button
        onClick={() => router.push('/partner/login')}
        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
      >
        Kembali ke Halaman Login
      </button>
    </div>
  );
}

export default function PartnerVerifyPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl">
        <Suspense fallback={
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-100">Memuat Sesi</h2>
          </div>
        }>
          <PartnerVerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
