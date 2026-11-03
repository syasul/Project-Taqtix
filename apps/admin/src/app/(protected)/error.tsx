'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
        Gagal Memuat Komponen Admin
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
        {error?.message || 'Terjadi kesalahan sistem saat merender data halaman ini.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba Muat Ulang</span>
      </button>
    </div>
  );
}
