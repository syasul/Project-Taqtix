'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { useOrganizerRole } from '../../hooks/use-organizer-role';
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
  Building2,
  CreditCard,
  SlidersHorizontal,
  LogOut,
  X,
} from 'lucide-react';

interface EventLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  resource?: string;
  badge?: string;
}

interface EventLinkGroup {
  groupTitle: string;
  groupBadge?: string;
  isHighlighted?: boolean;
  links: EventLinkItem[];
}

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuth();
  const { role, can, isOwner } = useOrganizerRole();

  const handleLogout = () => {
    if (onItemClick) onItemClick();
    logout();
    router.push('/login');
  };

  const isOrganizer = user?.role === 'organizer' || user?.role === 'organizer_member';
  const isPartner = user?.role === 'partner';

  // Deteksi apakah sedang berada di dalam konteks 1 event spesifik
  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const eventId = eventMatch && eventMatch[1] !== 'new' ? eventMatch[1] : null;
  const isEventScope = Boolean(eventId);

  // Menu Organisasi (Section 0)
  const organizationLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, resource: 'view_sales_revenue' },
    { href: '/dashboard/events', label: 'Daftar Event', icon: Calendar, resource: 'view_sales_revenue' },
    { href: '/dashboard/settings/team', label: 'Staff (Team Access)', icon: Users, resource: 'manage_team_access' },
    { href: '/dashboard/vouchers', label: 'Voucher', icon: TicketPercent, resource: 'manage_promo_code' },
    { href: '/dashboard/cash', label: 'Cash (Kas Organisasi)', icon: Banknote, resource: 'view_sales_revenue' },
    { href: '/dashboard/recap', label: 'Rekap Data', icon: FileSpreadsheet, resource: 'view_sales_revenue' },
    { href: '/dashboard/settings/password', label: 'Ubah Password', icon: KeyRound, resource: '' },
    { href: '/dashboard/settings/tokens', label: 'Token Generator (API)', icon: Code2, resource: 'manage_team_access' },
    { href: '/dashboard/guide', label: 'Panduan Penggunaan', icon: BookOpen, resource: '' },
    { href: '/dashboard/settings/organization', label: 'Profil Organizer', icon: Building2, resource: 'view_sales_revenue' },
    { href: '/dashboard/settings/payment', label: 'Rekening Settlement', icon: CreditCard, resource: 'manage_payment_settings' },
    { href: '/dashboard/settings/integrations', label: 'Integrasi Pixel', icon: SlidersHorizontal, resource: 'edit_organization_settings' },
  ];

  // Menu Event-Scoped Berkelompok (Grouped by Function)
  const eventLinkGroups: EventLinkGroup[] = eventId
    ? [
        {
          groupTitle: 'Setup & Syarat Event',
          groupBadge: 'Utama',
          isHighlighted: true,
          links: [
            {
              href: `/dashboard/events/${eventId}/edit`,
              label: 'Detail Event',
              icon: Edit3,
              resource: 'create_edit_event',
            },
            {
              href: `/dashboard/events/${eventId}/custom-fields`,
              label: 'Syarat & Formulir Pembeli',
              icon: ClipboardList,
              resource: 'create_edit_event',
              badge: 'Syarat Pembeli',
            },
            {
              href: `/dashboard/events/${eventId}/ticket-categories`,
              label: 'Kategori Tiket',
              icon: Ticket,
              resource: 'manage_ticket_category',
            },
            {
              href: `/dashboard/events/${eventId}/facilities`,
              label: 'Fasilitas Event',
              icon: Sparkles,
              resource: 'create_edit_event',
            },
            {
              href: `/dashboard/events/${eventId}/lineup`,
              label: 'Line Up Pengisi Acara',
              icon: Mic2,
              resource: 'create_edit_event',
            },
          ],
        },
        {
          groupTitle: 'Tiket & Penjualan',
          isHighlighted: false,
          links: [
            {
              href: `/dashboard/events/${eventId}/vouchers`,
              label: 'Voucher & Promo',
              icon: TicketPercent,
              resource: 'manage_promo_code',
            },
            {
              href: `/dashboard/events/${eventId}/pos`,
              label: 'Point Of Sales (POS)',
              icon: Store,
              resource: 'pos_cashier',
            },
            {
              href: `/dashboard/events/${eventId}/cash`,
              label: 'Kas Kasir (Cash)',
              icon: Banknote,
              resource: 'view_sales_revenue',
            },
            {
              href: `/dashboard/events/${eventId}/transfers`,
              label: 'Transfer Tiket',
              icon: ArrowLeftRight,
              resource: 'view_sales_revenue',
            },
            {
              href: `/dashboard/events/${eventId}/partners`,
              label: 'Leaderboard Partner',
              icon: TrendingUp,
              resource: 'view_sales_revenue',
            },
          ],
        },
        {
          groupTitle: 'Operasional & Gate',
          isHighlighted: false,
          links: [
            {
              href: `/dashboard/events/${eventId}/live`,
              label: 'Validasi Tiket (Check-In)',
              icon: QrCode,
              resource: 'pos_cashier',
            },
            {
              href: `/dashboard/events/${eventId}/workforce`,
              label: 'Workforce (Kru)',
              icon: Users,
              resource: 'manage_workforce_crew',
            },
            {
              href: `/dashboard/events/${eventId}/staff`,
              label: 'Staff (Penugasan)',
              icon: UserCheck,
              resource: 'manage_workforce_crew',
            },
            {
              href: `/dashboard/events/${eventId}/doorprize`,
              label: 'Doorprize',
              icon: Gift,
              resource: 'view_sales_revenue',
            },
            {
              href: `/dashboard/events/${eventId}/buyers`,
              label: 'Pengunjung (Tamu)',
              icon: Users,
              resource: 'view_sales_revenue',
            },
            {
              href: `/dashboard/events/${eventId}/blocked-visitors`,
              label: 'Pengunjung Nonaktif',
              icon: UserX,
              resource: 'view_sales_revenue',
            },
          ],
        },
        {
          groupTitle: 'Laporan & Analitik',
          isHighlighted: false,
          links: [
            {
              href: `/dashboard/events/${eventId}/sales`,
              label: 'Statistik Ringkasan',
              icon: BarChart3,
              resource: 'view_sales_revenue',
            },
            {
              href: `/dashboard/events/${eventId}/analytics/sales`,
              label: 'Analitik Mendalam',
              icon: TrendingUp,
              resource: 'view_analytics_growth',
            },
            {
              href: `/dashboard/events/${eventId}/audience/segments`,
              label: 'Marketing (Broadcast)',
              icon: Megaphone,
              resource: 'manage_audience_segments',
            },
            {
              href: `/dashboard/events/${eventId}/growth`,
              label: 'Growth (Sales Insight)',
              icon: TrendingUp,
              resource: 'view_analytics_growth',
            },
            {
              href: `/dashboard/events/${eventId}/export`,
              label: 'Laporan (Rekap Data)',
              icon: Download,
              resource: 'view_sales_revenue',
            },
          ],
        },
      ]
    : [];

  // Menu Partner
  const partnerLinks = [
    { href: `/dashboard/partners/${user?.id || ''}`, label: 'Performa Link', icon: TrendingUp },
  ];

  const activeLinkClass = 'bg-[#08B4B5]/10 border-[#08B4B5] text-[#08B4B5] font-bold';
  const inactiveLinkClass = 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium';

  return (
    <aside
      className={cn(
        'w-64 border-r flex flex-col justify-between shrink-0 h-full transition-colors',
        isEventScope ? 'bg-slate-50/50 border-teal-200/70' : 'bg-white border-slate-200',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* 1. Logo & Portal Title (Centered, consistent with Admin & Affiliates) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between relative shrink-0">
          <div className="w-full flex flex-col items-center justify-center text-center gap-1">
            <Link
              href="/dashboard"
              onClick={onItemClick}
              className="inline-flex justify-center items-center"
            >
              <Image
                src="/logo.png"
                alt="TAQtix Logo"
                width={120}
                height={34}
                className="h-7 w-auto object-contain mx-auto"
                priority
              />
            </Link>
            <span className="text-[9px] text-[#08B4B5] font-mono tracking-widest font-bold uppercase text-center">
              Organizer Platform
            </span>
          </div>
          {onItemClick && (
            <button
              onClick={onItemClick}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer md:hidden absolute right-4 top-6"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Event Context Header (Distinct Color for Event Scope) */}
        {isEventScope && (
          <div className="p-3 border-b border-teal-100 bg-gradient-to-b from-teal-500/10 via-teal-50/60 to-transparent shrink-0">
            <Link
              href="/dashboard/events"
              onClick={onItemClick}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition py-1.5 px-2.5 rounded-xl bg-white border border-teal-200 shadow-2xs w-full mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#08B4B5]" />
              <span className="truncate">Kembali ke Daftar Event</span>
            </Link>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#08B4B5] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#08B4B5]"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  Event Workspace
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#08B4B5] text-white shadow-2xs">
                Kelola Event
              </span>
            </div>
          </div>
        )}

        {/* 3. Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto min-h-0">
          {/* Level Event (Grouped & Spaced) */}
          {isEventScope &&
            eventLinkGroups.map((group, groupIdx) => {
              const filteredLinks = group.links.filter(
                (link) => !link.resource || can(link.resource)
              );
              if (filteredLinks.length === 0) return null;

              const isSetup = group.isHighlighted;

              return (
                <div key={group.groupTitle} className="space-y-1.5">
                  {/* Group Header Label */}
                  <div className="flex items-center justify-between px-2 pt-1">
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider',
                        isSetup ? 'text-[#08ADAE]' : 'text-slate-400'
                      )}
                    >
                      {group.groupTitle}
                    </span>
                    {group.groupBadge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-teal-100 text-[#08ADAE] border border-teal-200">
                        {group.groupBadge}
                      </span>
                    )}
                  </div>

                  {/* Group Container (Setup group is indented and highlighted) */}
                  <div
                    className={cn(
                      'space-y-1',
                      isSetup
                        ? 'p-1.5 bg-white border border-teal-100/90 rounded-2xl shadow-2xs ml-1 space-y-1'
                        : 'pl-1 space-y-0.5'
                    )}
                  >
                    {filteredLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive =
                        pathname === link.href || pathname.startsWith(link.href + '/');

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onItemClick}
                          className={cn(
                            'flex items-center justify-between px-2.5 py-2 rounded-xl transition text-xs',
                            isActive
                              ? 'bg-[#08B4B5] text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                          )}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                isActive ? 'text-white' : isSetup ? 'text-[#08B4B5]' : 'text-slate-400'
                              )}
                            />
                            <span className="truncate">{link.label}</span>
                          </div>

                          {link.badge && !isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-300 shrink-0">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Level Organisasi */}
          {!isEventScope &&
            isOrganizer &&
            organizationLinks
              .filter((link) => !link.resource || can(link.resource))
              .map((link) => {
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
      </div>

      {/* 4. User Profile Footer & Logout (Consistent with Affiliates & Admin) */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#08B4B5]/10 text-[#08B4B5] border border-[#08B4B5]/20 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {user?.email ? user.email[0] : 'O'}
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 text-xs truncate">
                {user?.email?.split('@')[0] || 'Organizer'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold text-[#08B4B5] uppercase font-mono tracking-wider bg-[#08B4B5]/10 px-1.5 py-0.2 rounded border border-[#08B4B5]/20">
                  {role || 'OWNER'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            aria-label="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-mono font-medium text-center">
          TAQtix v2.0 • Professional EO
        </p>
      </div>
    </aside>
  );
}
