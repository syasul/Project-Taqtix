'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/sidebar';
import { Loader2, ShieldAlert, Menu, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            logout();
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar (visible on md screens and up) */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        <Sidebar className="w-full h-full border-r-0" />
      </aside>

      {/* Mobile Sidebar Overlay Drawer (visible on mobile only when open) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <Sidebar className="w-full h-full border-r-0" onItemClick={() => setIsSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Matching Admin & Affiliates Platform Header) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:hidden cursor-pointer transition border border-slate-200/80 shadow-2xs"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Branding */}
            <div className="flex items-center gap-2 md:hidden">
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={90}
                height={26}
                className="h-6 w-auto object-contain"
                priority
              />
              <span className="text-[9px] text-[#08B4B5] font-mono tracking-wider font-bold uppercase bg-[#08B4B5]/10 px-1.5 py-0.5 rounded border border-[#08B4B5]/20">
                Organizer
              </span>
            </div>

            {/* Desktop Context Badge */}
            <div className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#08B4B5]/10 border border-[#08B4B5]/30 text-[#08B4B5] uppercase tracking-widest">
              <span>Organizer Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="hidden lg:inline text-slate-400 font-mono text-[11px]">
                {user?.email}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-0 min-w-0 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
