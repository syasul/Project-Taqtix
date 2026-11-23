'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import SidebarNav from './sidebar-nav';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  email: string;
}

export default function AdminLayoutWrapper({
  children,
  email,
}: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const pageTitles: Record<string, string> = {
        '/': 'Dashboard — TAQtix Admin',
        '/events': 'Manajemen Event — TAQtix Admin',
        '/orders': 'Manajemen Pesanan — TAQtix Admin',
        '/banners': 'Banner Promo — TAQtix Admin',
        '/organizers': 'Daftar Organizer — TAQtix Admin',
        '/partners': 'Mitra Afiliasi — TAQtix Admin',
        '/settlements': 'Settlement Dana — TAQtix Admin',
        '/billing': 'Billing & Invoice — TAQtix Admin',
        '/audit-log': 'Audit Log — TAQtix Admin',
      };
      document.title = pageTitles[pathname] || 'TAQtix Admin Console';
    }
  }, [pathname]);

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div>
        {/* Logo / Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between relative bg-white">
          <Link
            href="/"
            onClick={isMobile ? () => setIsSidebarOpen(false) : undefined}
            className="inline-flex items-center gap-2.5 px-2"
          >
            <Image
              src="/logo.png"
              alt="TAQtix Logo"
              width={110}
              height={30}
              className="h-6 w-auto object-contain"
              priority
            />
            <span className="text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-2.5">
              Admin
            </span>
          </Link>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <SidebarNav onItemClick={isMobile ? () => setIsSidebarOpen(false) : undefined} />
      </div>

      {/* Admin User Info & Logout */}
      <div className="p-4 border-t border-slate-200 space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Logged in as
          </span>
          <span className="block text-xs font-semibold text-slate-700 truncate" title={email}>
            {email}
          </span>
        </div>

        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600" />
            Keluar Sesi
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar (visible on md screens and up) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        {sidebarContent(false)}
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
          <aside className="relative w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:hidden cursor-pointer transition border border-slate-200/80 shadow-2xs"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Branding */}
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={90}
                height={26}
                className="h-6 w-auto object-contain"
                priority
              />
              <span className="text-xs font-semibold text-slate-500">
                Admin
              </span>
            </Link>

            {/* Desktop Environment Context */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-slate-700 font-semibold">core.taqtix.id</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-normal">Superadmin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#08B4B5]" />
              <span>Superadmin</span>
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
