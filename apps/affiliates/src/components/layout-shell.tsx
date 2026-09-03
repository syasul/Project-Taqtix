'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  TicketPercent,
  Banknote,
  Sparkles,
} from 'lucide-react';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On login page, render full screen with NO sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-slate-50 text-slate-900">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={130}
                height={36}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#08B4B5] block mt-1.5 font-mono">
              Affiliates Portal
            </span>
          </div>

          {/* Menu Links */}
          <nav className="p-4 space-y-1.5 text-xs">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition ${
                pathname === '/'
                  ? 'bg-[#08B4B5]/10 text-[#08B4B5]'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#08B4B5]" />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/events"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition ${
                pathname === '/events'
                  ? 'bg-[#08B4B5]/10 text-[#08B4B5]'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TicketPercent className="w-4 h-4 text-[#08B4B5]" />
              <span>Event & Kode Promo</span>
            </Link>

            <Link
              href="/payouts"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition ${
                pathname === '/payouts'
                  ? 'bg-[#08B4B5]/10 text-[#08B4B5]'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Banknote className="w-4 h-4 text-[#08B4B5]" />
              <span>Pencairan Komisi</span>
            </Link>

            <Link
              href="/promos"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition ${
                pathname === '/promos'
                  ? 'bg-[#08B4B5]/10 text-[#08B4B5]'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#08B4B5]" />
              <span>Manajemen Promo</span>
            </Link>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#08B4B5]/15 text-[#08B4B5] flex items-center justify-center font-bold text-xs">
              SM
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 text-xs truncate">Syamsul Ma’arif</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">syamsul.partner@gmail.com</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Saldo Siap Tarik:</span>
            <span className="font-mono font-bold text-emerald-600">Rp 2.733.750</span>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
