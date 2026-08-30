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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-indigo-650 tracking-wider">
                TAQtix Organizer
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {user && (
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                Organizer Console
              </span>
            )}
          </nav>

          {/* User Account & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), "relative h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-50 bg-slate-50 p-0 overflow-hidden cursor-pointer")}>
                  <span className="text-sm font-bold text-indigo-600 uppercase">
                    {user.email[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-800" align="end">
                  <div className="flex items-center justify-start gap-2 p-2 border-b border-slate-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer w-full flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-indigo-600" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-rose-50 focus:bg-rose-50 text-rose-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer")}>
                  Masuk
                </Link>
                <Link href="/register" className={cn(buttonVariants({ variant: 'default' }), "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer border border-transparent shadow-sm")}>
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation (Hamburger) */}
          <div className="flex md:hidden items-center space-x-2">
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "hover:bg-slate-50 text-slate-600 cursor-pointer")}>
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6 bg-white border-l border-slate-200 text-slate-800">
                <div className="flex flex-col space-y-6 mt-8">
                  {user ? (
                    <>
                      <Link href="/dashboard" className="text-lg font-medium text-slate-600 hover:text-indigo-600 transition">
                        Dashboard Home
                      </Link>
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <button
                          onClick={handleLogout}
                          className="mt-4 w-full flex items-center py-2 text-rose-600 font-medium hover:text-rose-700 transition"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-3 pt-6 border-t border-slate-200">
                      <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), "border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700")}>
                        Masuk
                      </Link>
                      <Link href="/register" className={cn(buttonVariants({ variant: 'default' }), "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer border border-transparent shadow-sm")}>
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
