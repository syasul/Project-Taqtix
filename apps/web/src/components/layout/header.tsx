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
          'astro-glass-pill',
          scrolled ? 'shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-slate-950/95 border-white/20' : ''
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
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] drop-shadow-[0_0_12px_rgba(8,173,174,0.35)]"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links (Astro Pill Style) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-300">
          <Link
            href="/"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/[0.08] active:scale-95"
          >
            Discovery
          </Link>
          <Link
            href="/events"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/[0.08] active:scale-95"
          >
            Event
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/[0.08] active:scale-95"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/[0.08] active:scale-95"
          >
            Contact
          </Link>
          <Link
            href="/tickets"
            className="px-4 py-2 rounded-full transition-all duration-200 text-teal-300 hover:text-white hover:bg-white/[0.08] active:scale-95 flex items-center gap-1.5"
          >
            <Ticket className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Tiket Saya</span>
          </Link>
        </nav>

        {/* User Account & Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), "relative h-10 w-10 rounded-full border border-white/20 hover:bg-slate-800 bg-slate-900 p-0 overflow-hidden cursor-pointer ring-2 ring-[#08ADAE]/30 shadow-xs")}>
                <span className="text-sm font-bold text-[#00F0FF] uppercase">
                  {user.email[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 astro-glass text-slate-200 rounded-2xl shadow-2xl p-1.5 border border-white/15" align="end">
                <div className="flex items-center justify-start gap-2 p-2.5 border-b border-white/10">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none text-white">{user.email}</p>
                    <p className="text-xs leading-none text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer w-full flex items-center rounded-xl p-2 text-xs font-semibold text-slate-200">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-[#00F0FF]" />
                  <span>Dashboard Tiket Saya</span>
                </DropdownMenuItem>
                {user.role === 'organizer' && (
                  <DropdownMenuItem
                    onClick={() => window.open(process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/dashboard', '_blank')}
                    className="hover:bg-teal-500/10 focus:bg-teal-500/10 cursor-pointer w-full flex items-center text-[#00F0FF] font-semibold rounded-xl p-2 text-xs"
                  >
                    <Building2 className="mr-2 h-4 w-4 text-[#00F0FF]" />
                    <span>Portal Organizer (EO)</span>
                  </DropdownMenuItem>
                )}
                {user.role === 'admin' && (
                  <DropdownMenuItem
                    onClick={() => window.open(process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002/admin', '_blank')}
                    className="hover:bg-purple-500/10 focus:bg-purple-500/10 cursor-pointer w-full flex items-center text-purple-400 font-semibold rounded-xl p-2 text-xs"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-purple-400" />
                    <span>Portal Super Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-rose-500/10 focus:bg-rose-500/10 text-rose-400 cursor-pointer rounded-xl p-2 text-xs">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-full transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-extrabold text-slate-950 bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] hover:opacity-95 shadow-[0_0_20px_rgba(8,173,174,0.4)] transition-all active:scale-[0.98]"
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
            <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-10 w-10 rounded-full hover:bg-white/10 text-slate-200 cursor-pointer")}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6 bg-slate-950/95 border-l border-white/15 text-slate-100 rounded-l-3xl backdrop-blur-2xl">
              <div className="flex items-center gap-2 pb-6 border-b border-white/10">
                <Image
                  src="/logo.png"
                  alt="TAQtix Logo"
                  width={110}
                  height={30}
                  className="h-7 w-auto object-contain drop-shadow-[0_0_12px_rgba(8,173,174,0.35)]"
                />
              </div>
              <div className="flex flex-col space-y-2 mt-6">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  Discovery
                </Link>
                <Link
                  href="/events"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  Event
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  Contact
                </Link>
                <Link
                  href="/tickets"
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-teal-300 hover:bg-white/10 hover:text-white transition flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-[#00F0FF]" />
                  <span>Tiket Saya</span>
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#00F0FF] bg-teal-500/10 transition"
                    >
                      Dashboard Tiket Saya
                    </Link>
                    <div className="border-t border-white/10 pt-4 mt-2">
                      <p className="text-xs text-slate-400 px-4">{user.email}</p>
                      <button
                        onClick={handleLogout}
                        className="mt-3 w-full flex items-center px-4 py-2.5 rounded-2xl text-sm text-rose-400 font-semibold hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                    <Link
                      href="/login"
                      className="w-full text-center py-2.5 text-xs font-semibold text-slate-300 border border-white/15 rounded-full hover:bg-white/10 transition"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="w-full text-center py-2.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-[#08ADAE] to-[#00F0FF] rounded-full shadow-lg transition"
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
