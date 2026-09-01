'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserCheck, 
  ArrowLeft,
  Settings,
  HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventTabsProps {
  eventId: string;
}

export default function EventTabs({ eventId }: EventTabsProps) {
  const pathname = usePathname() || '';

  const tabs = [
    {
      label: 'Ringkasan',
      href: `/dashboard/events/${eventId}/sales`,
      icon: BarChart3,
      active: pathname === `/dashboard/events/${eventId}/sales`
    },
    {
      label: 'Analitik Sales',
      href: `/dashboard/events/${eventId}/analytics/sales`,
      icon: TrendingUp,
      active: pathname === `/dashboard/events/${eventId}/analytics/sales`
    },
    {
      label: 'Distribusi',
      href: `/dashboard/events/${eventId}/analytics/distribution`,
      icon: BarChart3,
      active: pathname === `/dashboard/events/${eventId}/analytics/distribution`
    },
    {
      label: 'Demografi',
      href: `/dashboard/events/${eventId}/analytics/audience`,
      icon: Users,
      active: pathname === `/dashboard/events/${eventId}/analytics/audience`
    },
    {
      label: 'Funnel',
      href: `/dashboard/events/${eventId}/analytics/performance`,
      icon: TrendingUp,
      active: pathname === `/dashboard/events/${eventId}/analytics/performance`
    },
    {
      label: 'CRM Segmen',
      href: `/dashboard/events/${eventId}/segments`,
      icon: Users,
      active: pathname.startsWith(`/dashboard/events/${eventId}/segments`)
    },
    {
      label: 'Workforce',
      href: `/dashboard/events/${eventId}/workforce`,
      icon: UserCheck,
      active: pathname === `/dashboard/events/${eventId}/workforce`
    },
    {
      label: 'Growth (ROAS)',
      href: `/dashboard/events/${eventId}/growth`,
      icon: TrendingUp,
      active: pathname === `/dashboard/events/${eventId}/growth`
    },
    {
      label: 'Leaderboard Partner',
      href: `/dashboard/events/${eventId}/partners`,
      icon: HeartHandshake,
      active: pathname === `/dashboard/events/${eventId}/partners`
    }
  ];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Event
        </Link>
      </div>

      {/* Tabs list */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-900 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border",
                tab.active
                  ? "bg-[#08B4B5]/15 border-[#08B4B5]/40 text-[#08B4B5]"
                  : "bg-slate-900/20 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
