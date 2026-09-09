'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import EventTabs from '@/components/layout/event-tabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { 
  TrendingUp, 
  PieChart, 
  Users, 
  Kanban,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname() || '';
  const eventId = params?.id as string;

  const subTabs = [
    {
      id: 'sales',
      label: 'Sales (Penjualan)',
      href: `/dashboard/events/${eventId}/analytics/sales`,
      icon: TrendingUp,
      active: pathname.includes('/analytics/sales'),
    },
    {
      id: 'distribution',
      label: 'Distribution (Kanal)',
      href: `/dashboard/events/${eventId}/analytics/distribution`,
      icon: PieChart,
      active: pathname.includes('/analytics/distribution'),
    },
    {
      id: 'audience',
      label: 'Audience (Profil Audiens)',
      href: `/dashboard/events/${eventId}/analytics/audience`,
      icon: Users,
      active: pathname.includes('/analytics/audience'),
    },
    {
      id: 'performance',
      label: 'Performance (Funnel)',
      href: `/dashboard/events/${eventId}/analytics/performance`,
      icon: Kanban,
      active: pathname.includes('/analytics/performance'),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'Daftar Event', href: '/dashboard/events' },
          { label: 'Analitik & Pelaporan' },
        ]}
      />
      <EventTabs eventId={eventId} />

      {/* Sub-Tabs Navigation for 4 Analytics Sub-Dashboards */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/80 overflow-x-auto scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap',
                tab.active
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', tab.active ? 'text-[#08B4B5]' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Content Area */}
      <div>{children}</div>
    </div>
  );
}
