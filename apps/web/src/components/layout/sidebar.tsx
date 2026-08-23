'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Calendar,
  PlusCircle,
  Users,
  QrCode,
  LayoutDashboard,
  Settings,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

/**
 * Sidebar Dashboard untuk Organizer dan Partner portal.
 */
export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isOrganizer = user?.role === 'organizer';
  const isPartner = user?.role === 'partner';

  // Menu untuk Organizer
  const organizerLinks = [
    { href: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'Daftar Event', icon: Calendar },
    { href: '/dashboard/events/new', label: 'Buat Event', icon: PlusCircle },
  ];

  // Menu untuk Partner Afiliasi
  const partnerLinks = [
    { href: `/dashboard/partners/${user?.id || ''}`, label: 'Performa Link', icon: TrendingUp },
  ];

  const activeLinkClass = 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-semibold';
  const inactiveLinkClass = 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200';

  return (
    <aside className={cn("w-64 border-r border-slate-850 bg-slate-950 flex flex-col shrink-0", className)}>
      {/* Profil Ringkas */}
      <div className="p-6 border-b border-slate-850">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 truncate max-w-[150px]">
              {user?.email.split('@')[0]}
            </h4>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tautan Navigasi */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 block">
          Menu Utama
        </span>
        
        {isOrganizer &&
          organizerLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center space-x-3 px-3 py-3 border-l-2 rounded-r-xl transition text-sm ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

        {isPartner &&
          partnerLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center space-x-3 px-3 py-3 border-l-2 rounded-r-xl transition text-sm ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-6 border-t border-slate-850 text-center">
        <p className="text-[10px] text-slate-600 font-mono">TAQtix v1.0.0 (MVP)</p>
      </div>
    </aside>
  );
}
