'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  TicketPercent,
  Banknote,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    setIsSidebarOpen(false);
    localStorage.removeItem('affiliate_auth_token');
    toast.success('Berhasil logout dari Portal Afiliasi');
    router.push('/login');
  };

  // On login page, render full screen with NO sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const navLinks = [
    { href: '/', label: 'Dashboard Overview', icon: LayoutDashboard },
    { href: '/events', label: 'Event & Kode Promo', icon: TicketPercent },
    { href: '/payouts', label: 'Pencairan Komisi', icon: Banknote },
    { href: '/promos', label: 'Manajemen Promo', icon: Sparkles },
  ];

  const renderSidebarContent = (isMobile: boolean) => (
    <>
      <div>
        {/* Logo & Branding */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between relative">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <Link
              href="/"
              onClick={isMobile ? () => setIsSidebarOpen(false) : undefined}
              className="inline-flex justify-center items-center"
            >
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={130}
                height={36}
                className="h-7 w-auto object-contain mx-auto"
                priority
              />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#08B4B5] block mt-1.5 font-mono text-center">
              Affiliates Portal
            </span>
          </div>

          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer absolute right-4 top-5 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Menu Links */}
        <nav className="p-4 space-y-1.5 text-xs">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? () => setIsSidebarOpen(false) : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition ${
                  isActive
                    ? 'bg-[#08B4B5]/10 text-[#08B4B5]'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-[#08B4B5]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#08B4B5]/15 text-[#08B4B5] flex items-center justify-center font-bold text-xs shrink-0">
              SM
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 text-xs truncate">Syamsul Ma’arif</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">syamsul.partner@gmail.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            aria-label="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Saldo Siap Tarik:</span>
          <span className="font-mono font-bold text-emerald-600">Rp 2.733.750</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (visible on md+ screens) */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Sticky Header with Hamburger Button */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-750 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TAQtix Logo"
              width={100}
              height={28}
              className="h-6 w-auto object-contain"
              priority
            />
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#08B4B5] font-mono bg-[#08B4B5]/10 px-2 py-0.5 rounded-md border border-[#08B4B5]/20">
              Afiliasi
            </span>
          </Link>
        </div>

        <Link
          href="/payouts"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-mono font-bold transition shadow-xs"
          title="Saldo Siap Tarik"
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rp 2,7 Jt</span>
        </Link>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl w-full mx-auto overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

