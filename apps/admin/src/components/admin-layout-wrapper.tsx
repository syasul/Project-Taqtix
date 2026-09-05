'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div>
        {/* Logo / Branding */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between relative">
          <div className="w-full flex flex-col items-center justify-center text-center gap-1">
            <Image
              src="/logo.png"
              alt="TAQtix Logo"
              width={120}
              height={34}
              className="h-7 w-auto object-contain mx-auto"
              priority
            />
            <span className="text-[9px] text-[#08B4B5] font-mono tracking-widest font-bold uppercase text-center">
              Admin Platform
            </span>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 cursor-pointer md:hidden absolute right-4 top-6"
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
                Admin
              </span>
            </div>

            <div className="hidden md:inline-flex px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#08B4B5]/10 border border-[#08B4B5]/30 text-[#08B4B5] uppercase tracking-widest">
              Secured Console
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
              Online
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
