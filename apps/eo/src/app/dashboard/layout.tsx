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
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Jika token ada tapi profile belum di-decode atau bukan organizer
  if (user && user.role !== 'organizer' && user.role !== 'organizer_member') {
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
      
      {/* Mobile sub-header for dashboard navigation */}
      <div className="md:hidden flex items-center justify-between px-6 py-3.5 bg-slate-955 border-b border-slate-900 text-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Dashboard Portal
        </span>
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl transition cursor-pointer">
            <Menu className="h-4 w-4 text-indigo-400" />
            Menu Dashboard
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-slate-950 border-r border-slate-900 text-slate-200" showCloseButton={true}>
            <div className="pt-8 h-full">
              <Sidebar className="w-full h-full border-r-0" onItemClick={() => setIsSidebarOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1">
        <Sidebar className="hidden md:flex h-[calc(100vh-4rem)] sticky top-16" />
        <main className="flex-1 p-4 md:p-8 bg-slate-950 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
