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
} from 'lucide-react';

export default function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Organizer', href: '/organizers', icon: Users },
    { label: 'Event', href: '/events', icon: Calendar },
    { label: 'Order', href: '/orders', icon: FileSearch },
    { label: 'Settlement', href: '/settlements', icon: DollarSign },
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
                ? 'bg-red-50/70 border-l-4 border-red-600 text-red-700 pl-3 font-bold'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50 pl-4 font-semibold'
            }`}
          >
            <item.icon
              className={`w-5 h-5 transition-colors ${
                isActive
                  ? 'text-red-600'
                  : 'text-slate-400 group-hover:text-red-600'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
