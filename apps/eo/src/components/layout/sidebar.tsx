'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Users,
  LayoutDashboard,
  TrendingUp,
  TicketPercent,
  Banknote,
  FileSpreadsheet,
  KeyRound,
  Code2,
  BookOpen,
  ArrowLeft,
  Edit3,
  ClipboardList,
  Ticket,
  Sparkles,
  Mic2,
  ArrowLeftRight,
  UserX,
  Store,
  Gift,
  QrCode,
  Megaphone,
  Download,
  BarChart3,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname() || '';
  const { user } = useAuth();

  const isOrganizer = user?.role === 'organizer' || user?.role === 'organizer_member';
  const isPartner = user?.role === 'partner';

  // Deteksi apakah sedang berada di dalam konteks 1 event spesifik
  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const eventId = eventMatch && eventMatch[1] !== 'new' ? eventMatch[1] : null;
  const isEventScope = Boolean(eventId);

  // Menu Organisasi
  const organizationLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'Daftar Event', icon: Calendar },
    { href: '/dashboard/settings/team', label: 'Staff (Team)', icon: Users },
    { href: '/dashboard/vouchers', label: 'Voucher', icon: TicketPercent },
    { href: '/dashboard/cash', label: 'Cash (Rekonsiliasi)', icon: Banknote },
    { href: '/dashboard/recap', label: 'Rekap Data', icon: FileSpreadsheet },
    { href: '/dashboard/settings/password', label: 'Ubah Password', icon: KeyRound },
    { href: '/dashboard/settings/tokens', label: 'Token Generator (API)', icon: Code2 },
    { href: '/dashboard/guide', label: 'Panduan Penggunaan', icon: BookOpen },
  ];

  // Menu Event-Scoped
  const eventLinks = eventId
    ? [
        { href: `/dashboard/events/${eventId}/sales`, label: 'Statistik Ringkasan', icon: BarChart3 },
        { href: `/dashboard/events/${eventId}/edit`, label: 'Detail Event', icon: Edit3 },
        { href: `/dashboard/events/${eventId}/custom-fields`, label: 'Formulir Tambahan', icon: ClipboardList },
        { href: `/dashboard/events/${eventId}/ticket-categories`, label: 'Kategori Tiket', icon: Ticket },
        { href: `/dashboard/events/${eventId}/facilities`, label: 'Fasilitas Event', icon: Sparkles },
        { href: `/dashboard/events/${eventId}/staff`, label: 'Staff Penugasan', icon: UserCheck },
        { href: `/dashboard/events/${eventId}/lineup`, label: 'Line Up Performer', icon: Mic2 },
        { href: `/dashboard/events/${eventId}/vouchers`, label: 'Voucher Event', icon: TicketPercent },
        { href: `/dashboard/events/${eventId}/cash`, label: 'Cash Event', icon: Banknote },
        { href: `/dashboard/events/${eventId}/transfers`, label: 'Transfer Tiket', icon: ArrowLeftRight },
        { href: `/dashboard/events/${eventId}/pos`, label: 'Point of Sales (POS)', icon: Store },
        { href: `/dashboard/events/${eventId}/doorprize`, label: 'Doorprize', icon: Gift },
        { href: `/dashboard/events/${eventId}/live`, label: 'Validasi / Check-in', icon: QrCode },
        { href: `/dashboard/events/${eventId}/segments`, label: 'Marketing (Broadcast)', icon: Megaphone },
        { href: `/dashboard/events/${eventId}/growth`, label: 'Sales Insight', icon: TrendingUp },
        { href: `/dashboard/events/${eventId}/buyers`, label: 'Daftar Pengunjung', icon: Users },
        { href: `/dashboard/events/${eventId}/blocked-visitors`, label: 'Pengunjung Nonaktif', icon: UserX },
        { href: `/dashboard/events/${eventId}/export`, label: 'Laporan (Rekap Data)', icon: Download },
      ]
    : [];

  // Menu Partner
  const partnerLinks = [
    { href: `/dashboard/partners/${user?.id || ''}`, label: 'Performa Link', icon: TrendingUp },
  ];

  const activeLinkClass = 'bg-[#08B4B5]/10 border-[#08B4B5] text-[#08B4B5] font-bold';
  const inactiveLinkClass = 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium';

  return (
    <aside className={cn('w-64 border-r border-slate-200 bg-white flex flex-col shrink-0', className)}>
      {/* Header Sidebar / Context Header */}
      {isEventScope ? (
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <Link
            href="/dashboard/events"
            onClick={onItemClick}
            className="flex items-center gap-2 text-xs font-bold text-[#08B4B5] hover:text-[#079b9c] transition py-2 px-3 rounded-xl bg-white border border-slate-200 shadow-xs w-full mb-2.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Event</span>
          </Link>
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-[#08B4B5]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Event Workspace
            </span>
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#08B4B5]/10 border border-[#08B4B5]/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-[#08B4B5]" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {user?.email?.split('@')[0] || 'Organizer'}
              </h4>
              <span className="text-[10px] font-bold text-[#08B4B5] uppercase tracking-wider bg-[#08B4B5]/10 px-2 py-0.5 rounded-full border border-[#08B4B5]/20 mt-1 inline-block">
                {user?.role || 'ORGANIZER'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tautan Navigasi */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
          {isEventScope ? 'Fitur Event' : 'Menu Organisasi'}
        </span>

        {/* Level Event */}
        {isEventScope &&
          eventLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center space-x-3 px-3 py-2.5 border-l-3 rounded-r-xl transition text-xs ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#08B4B5]' : 'text-slate-400'}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}

        {/* Level Organisasi */}
        {!isEventScope &&
          isOrganizer &&
          organizationLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center space-x-3 px-3 py-2.5 border-l-3 rounded-r-xl transition text-xs ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#08B4B5]' : 'text-slate-400'}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}

        {/* Level Partner */}
        {isPartner &&
          partnerLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center space-x-3 px-3 py-2.5 border-l-3 rounded-r-xl transition text-xs ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#08B4B5]' : 'text-slate-400'}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-mono font-medium">TAQtix v2.0 • Professional EO</p>
      </div>
    </aside>
  );
}
