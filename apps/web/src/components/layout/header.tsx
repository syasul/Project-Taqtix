'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, LayoutDashboard, Menu, Building2, ShieldCheck, Ticket, Sparkles, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 transition-all duration-300">
      <div
        className={cn(
          'mx-auto max-w-6xl flex h-16 items-center justify-between px-5 sm:px-6 rounded-full transition-all duration-300',
          'liquid-glass-pill',
          scrolled ? 'shadow-[0_16px_36px_-10px_rgba(0,0,0,0.1)] bg-white/90 border-white/90' : ''
        )}
      >
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-28 sm:w-32 flex items-center">
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={120}
                height={34}
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links (Pulse AI Pill Style) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-[#08ADAE] hover:bg-black/[0.03] active:scale-95"
          >
            Discovery
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-[#08ADAE] hover:bg-black/[0.03] active:scale-95"
          >
            About
          </Link>
          <Link
            href="/help"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-[#08ADAE] hover:bg-black/[0.03] active:scale-95"
          >
            Help Center
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-[#08ADAE] hover:bg-black/[0.03] active:scale-95"
          >
            Contact
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full transition-all duration-200 text-[#08ADAE] font-semibold bg-[#08ADAE]/10 hover:bg-[#08ADAE]/20"
            >
              Tiket Saya
            </Link>
          )}
        </nav>

        {/* User Account & Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), "relative h-10 w-10 rounded-full border border-white/80 hover:bg-slate-50 bg-white/60 p-0 overflow-hidden cursor-pointer ring-2 ring-[#08ADAE]/20 shadow-xs")}>
                <span className="text-sm font-bold text-[#08ADAE] uppercase">
                  {user.email[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 liquid-glass text-slate-800 rounded-2xl shadow-2xl p-1.5 border border-white/80" align="end">
                <div className="flex items-center justify-start gap-2 p-2.5 border-b border-slate-100/80">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none text-slate-900">{user.email}</p>
                    <p className="text-xs leading-none text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="hover:bg-slate-50/80 focus:bg-slate-50/80 cursor-pointer w-full flex items-center rounded-xl p-2 text-xs font-semibold text-slate-700">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-[#08ADAE]" />
                  <span>Dashboard Tiket Saya</span>
                </DropdownMenuItem>
                {user.role === 'organizer' && (
                  <DropdownMenuItem
                    onClick={() => window.open(process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/dashboard', '_blank')}
                    className="hover:bg-teal-50/80 focus:bg-teal-50/80 cursor-pointer w-full flex items-center text-[#08ADAE] font-semibold rounded-xl p-2 text-xs"
                  >
                    <Building2 className="mr-2 h-4 w-4 text-[#08ADAE]" />
                    <span>Portal Organizer (EO)</span>
                  </DropdownMenuItem>
                )}
                {user.role === 'admin' && (
                  <DropdownMenuItem
                    onClick={() => window.open(process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002/admin', '_blank')}
                    className="hover:bg-purple-50/80 focus:bg-purple-50/80 cursor-pointer w-full flex items-center text-purple-600 font-semibold rounded-xl p-2 text-xs"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Portal Super Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-rose-50/80 focus:bg-rose-50/80 text-rose-600 cursor-pointer rounded-xl p-2 text-xs">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#08ADAE] rounded-full transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#08ADAE] hover:bg-[#07999A] shadow-[0_4px_14px_rgba(8,173,174,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98]"
              >
                <span>Daftar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation (Hamburger) */}
        <div className="flex md:hidden items-center">
          <Sheet>
            <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-10 w-10 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer")}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6 bg-white border-l border-slate-200 text-slate-800 rounded-l-3xl">
              <div className="flex items-center gap-2 pb-6 border-b border-slate-100">
                <Image
                  src="/logo.png"
                  alt="TAQtix Logo"
                  width={110}
                  height={30}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col space-y-3 mt-6">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-[#08ADAE]/10 hover:text-[#08ADAE] transition"
                >
                  Discovery
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-[#08ADAE]/10 hover:text-[#08ADAE] transition"
                >
                  About
                </Link>
                <Link
                  href="/help"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-[#08ADAE]/10 hover:text-[#08ADAE] transition"
                >
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-[#08ADAE]/10 hover:text-[#08ADAE] transition"
                >
                  Contact
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#08ADAE] bg-[#08ADAE]/10 transition"
                    >
                      Dashboard Tiket Saya
                    </Link>
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <p className="text-xs text-slate-400 px-4">{user.email}</p>
                      <button
                        onClick={handleLogout}
                        className="mt-3 w-full flex items-center px-4 py-2.5 rounded-2xl text-sm text-rose-600 font-semibold hover:bg-rose-50 transition"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                    <Link
                      href="/login"
                      className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="w-full text-center py-2.5 text-xs font-bold text-white bg-[#08ADAE] hover:bg-[#079b9c] rounded-full shadow-sm transition"
                    >
                      Daftar Akun Baru
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
