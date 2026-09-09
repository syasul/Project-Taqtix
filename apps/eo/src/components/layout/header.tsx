'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={120}
                height={34}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-[#08B4B5] font-mono bg-[#08B4B5]/10 px-2 py-0.5 rounded border border-[#08B4B5]/20">
              Organizer Portal
            </span>
          </div>

          {/* User Account & Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'relative h-9 w-9 rounded-full border border-slate-200 hover:bg-slate-50 bg-slate-50 p-0 overflow-hidden cursor-pointer'
                  )}
                >
                  <span className="text-xs font-bold text-[#08B4B5] uppercase">
                    {user.email ? user.email[0] : 'O'}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-800" align="end">
                  <div className="flex items-center justify-start gap-2 p-3 border-b border-slate-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-bold leading-none text-slate-900">{user.email}</p>
                      <p className="text-[10px] leading-none text-slate-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard')}
                    className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer w-full flex items-center text-xs font-medium text-slate-700"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4 text-[#08B4B5]" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-rose-50 focus:bg-rose-50 text-rose-600 cursor-pointer text-xs font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'text-slate-700 hover:text-[#08B4B5] hover:bg-slate-50 cursor-pointer text-xs font-bold'
                  )}
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
