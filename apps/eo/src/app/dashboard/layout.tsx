'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Loader2, ShieldAlert, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isClient) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
      </div>
    );
  }

  // Jika token ada tapi profile belum di-decode atau bukan organizer
  if (user && user.role !== 'organizer' && user.role !== 'organizer_member') {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Akses Ditolak</h2>
        <p className="text-slate-500 text-xs max-w-sm">Halaman ini hanya dapat diakses oleh akun Event Organizer terdaftar.</p>
        <button
          onClick={() => {
            useAuth.getState().logout();
            router.push('/login');
          }}
          className="px-5 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Logout & Login Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Header />

      {/* Mobile sub-header for dashboard navigation */}
      <div className="md:hidden flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200 text-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-[#08B4B5]">
          Organizer Portal
        </span>
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs">
            <Menu className="h-4 w-4 text-[#08B4B5]" />
            <span>Menu Sidebar</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-white border-r border-slate-200 text-slate-800" showCloseButton={true}>
            <div className="pt-8 h-full">
              <Sidebar className="w-full h-full border-r-0" onItemClick={() => setIsSidebarOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1 min-w-0">
        <Sidebar className="hidden md:flex h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-slate-200" />
        <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-4rem)] overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
