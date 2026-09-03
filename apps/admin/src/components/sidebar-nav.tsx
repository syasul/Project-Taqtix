'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileSearch,
  DollarSign,
  History,
  HeartHandshake,
  TicketPercent,
  Image as ImageIcon,
} from 'lucide-react';

export default function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Organizer', href: '/organizers', icon: Users },
    { label: 'Approval & Event', href: '/events', icon: Calendar },
    { label: 'Partner & Afiliasi', href: '/partners', icon: HeartHandshake },
    { label: 'Kelola Promo', href: '/promos', icon: TicketPercent },
    { label: 'Kelola Banner', href: '/banners', icon: ImageIcon },
    { label: 'Order', href: '/orders', icon: FileSearch },
    { label: 'Settlement & Payout', href: '/settlements', icon: DollarSign },
    { label: 'Billing Control', href: '/billing', icon: DollarSign },
    { label: 'Leads Pipeline', href: '/leads', icon: Users },
    { label: 'Audit Log', href: '/audit-log', icon: History },
  ];

  return (
    <nav className="p-4 space-y-1">
      {menuItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 py-3 rounded-r-lg transition-all duration-200 text-sm group ${
              isActive
                ? 'bg-[#08B4B5]/10 border-l-4 border-[#08B4B5] text-[#08B4B5] pl-3 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 pl-4 font-semibold'
            }`}
          >
            <item.icon
              className={`w-5 h-5 transition-colors ${
                isActive
                  ? 'text-[#08B4B5]'
                  : 'text-slate-400 group-hover:text-[#08B4B5]'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
