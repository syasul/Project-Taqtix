'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/header';

export default function WebNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* 404 Illustration */}
        <div className="relative w-72 sm:w-80 md:w-96 max-w-full aspect-square mb-6 drop-shadow-sm">
          <Image
            src="/404.jpg"
            alt="404 - Page Not Found"
            fill
            className="object-contain rounded-2xl"
            priority
          />
        </div>

        <div className="max-w-md space-y-3">
          <span className="px-3 py-1 bg-[#08B4B5]/10 border border-[#08B4B5]/30 text-[#08B4B5] rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Error 404 • Page Not Found
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Oops! Halaman atau event yang Anda cari sepertinya tidak ada, telah berakhir, atau tautan yang dimasukkan salah.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
