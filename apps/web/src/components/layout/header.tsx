'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, LayoutDashboard, Menu } from 'lucide-react';
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent tracking-wider">
                TAQtix
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition">
              Discovery
            </Link>
            <Link href="/about" className="text-sm font-medium text-slate-300 hover:text-white transition">
              About
            </Link>
            {user && (
              <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition">
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Account & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), "relative h-10 w-10 rounded-full border border-slate-800 hover:bg-slate-900 bg-slate-900/40 p-0 overflow-hidden cursor-pointer")}>
                  <span className="text-sm font-bold text-indigo-400 uppercase">
                    {user.email[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-850 text-slate-200" align="end">
                  <div className="flex items-center justify-start gap-2 p-2 border-b border-slate-850">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-slate-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer w-full flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-indigo-400" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-rose-500/10 focus:bg-rose-500/10 text-rose-400 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), "text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer")}>
                  Masuk
                </Link>
                <Link href="/register" className={cn(buttonVariants({ variant: 'default' }), "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold cursor-pointer")}>
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation (Hamburger) */}
          <div className="flex md:hidden items-center space-x-2">
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "hover:bg-slate-900 text-slate-300 cursor-pointer")}>
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-slate-950 border-l border-slate-850 text-slate-200">
                <div className="flex flex-col space-y-6 mt-8">
                  <Link href="/" className="text-lg font-medium text-slate-300 hover:text-white transition">
                    Discovery
                  </Link>
                  <Link href="/about" className="text-lg font-medium text-slate-300 hover:text-white transition">
                    About
                  </Link>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="text-lg font-medium text-slate-300 hover:text-white transition">
                        Dashboard
                      </Link>
                      <div className="border-t border-slate-800 pt-4 mt-4">
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <button
                          onClick={handleLogout}
                          className="mt-4 w-full flex items-center py-2 text-rose-400 font-medium hover:text-rose-300 transition"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-3 pt-6 border-t border-slate-850">
                      <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), "border-slate-800 bg-slate-900/20 hover:bg-slate-900 cursor-pointer text-slate-200")}>
                        Masuk
                      </Link>
                      <Link href="/register" className={cn(buttonVariants({ variant: 'default' }), "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold cursor-pointer")}>
                        Daftar
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
