'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !accessToken) {
      router.push('/login');
    }
  }, [isClient, accessToken, router]);

  if (!isClient) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Jika token ada tapi profile belum di-decode atau bukan organizer
  if (user && user.role !== 'organizer') {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Halaman ini hanya dapat diakses oleh Event Organizer.</p>
        <button
          onClick={() => {
            useAuth.getState().logout();
            router.push('/login');
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Logout & Login Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-950 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
