'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { LogOut, User, LayoutDashboard, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

/**
 * Navbar utama responsif untuk halaman publik TAQtix.
 */
export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            TAQtix
          </span>
        </Link>

        {/* Desktop Navigation */}
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
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-800 hover:bg-slate-900 bg-slate-900/40 p-0 overflow-hidden cursor-pointer">
                  <span className="text-sm font-bold text-indigo-400 uppercase">
                    {user.email[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-900 border-slate-850 text-slate-200" align="end">
                <div className="flex items-center justify-start gap-2 p-2 border-b border-slate-850">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <DropdownMenuItem asChild className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                  <Link href="/dashboard" className="w-full flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-indigo-400" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-rose-500/10 focus:bg-rose-500/10 text-rose-400 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold cursor-pointer">
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation (Hamburger) */}
        <div className="flex md:hidden items-center space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-slate-900 text-slate-300 cursor-pointer">
                <Menu className="h-6 w-6" />
              </Button>
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
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/20 hover:bg-slate-900 cursor-pointer text-slate-200">
                      <Link href="/login">Masuk</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold cursor-pointer">
                      <Link href="/register">Daftar</Link>
                    </Button>
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
