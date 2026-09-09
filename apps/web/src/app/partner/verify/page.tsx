'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        if (res.data?.success && res.data?.data) {
          const { accessToken, refreshToken } = res.data.data;
          setAuth(accessToken, refreshToken);
          setStatus('success');
          toast.success('Login partner berhasil!');
          
          setTimeout(() => {
            router.push('/partner/dashboard');
          }, 1200);
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
        <Loader2 className="h-10 w-10 text-[#08B4B5] animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">Memverifikasi Tautan Masuk</h2>
        <p className="text-xs text-slate-400">Harap tunggu sementara kami memverifikasi akun partner Anda...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Verifikasi Sukses!</h2>
        <p className="text-xs text-slate-300">Mengarahkan Anda ke Dashboard Partner...</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-5">
      <div className="h-14 w-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
        <AlertCircle className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white">Tautan Tidak Valid atau Kedaluwarsa</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Tautan masuk cepat ini sudah digunakan atau telah melewati batas waktu 15 menit.
        </p>
      </div>
      <Link href="/partner/login">
        <Button
          className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          <span>Minta Link Baru</span>
        </Button>
      </Link>
    </div>
  );
}

export default function PartnerVerifyPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700/80 rounded-3xl max-w-sm w-full p-8 shadow-2xl">
        <Suspense fallback={
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin mx-auto" />
            <h2 className="text-sm font-bold text-white">Memuat Sesi...</h2>
          </div>
        }>
          <PartnerVerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
