'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, PlusCircle, ArrowRight, Activity, Award } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardSummaryPage() {
  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['organizer-events-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/organizer/events');
      return res.data?.data || [];
    },
  });

  const events = eventsResponse || [];
  const draftEvents = events.filter((e: any) => e.status === 'DRAFT' || e.status === 'draft');
  const publishedEvents = events.filter((e: any) => e.status === 'PUBLISHED' || e.status === 'published');

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Ringkasan Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Pantau status publikasi, performa partner, dan kelola kelancaran e-ticketing Anda.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Event
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isLoading ? '...' : events.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Acara yang telah didaftarkan</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Draft Event
            </CardTitle>
            <Activity className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isLoading ? '...' : draftEvents.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Belum dipublikasikan ke publik</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-850">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Published Event
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {isLoading ? '...' : publishedEvents.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Sedang aktif menerima pesanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/40 border-slate-850 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Kelola Event Anda</h3>
            <p className="text-xs text-slate-400 mt-1">
              Lihat penjualan tiket, atur tipe kategori tiket, dan monitor kehadiran check-in gate staff.
            </p>
          </div>
          <Link href="/dashboard/events" className={cn(buttonVariants({ variant: 'outline' }), "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 hover:border-transparent rounded-xl flex items-center gap-2 font-bold cursor-pointer justify-center w-full py-2.5 h-auto")}>
            <span>Buka Daftar Event</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card className="bg-slate-900/40 border-slate-855 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Buat Event Baru</h3>
            <p className="text-xs text-slate-400 mt-1">
              Daftarkan acara konser, kajian, seminar, atau festival baru Anda ke platform TAQtix.
            </p>
          </div>
          <Link href="/dashboard/events/new" className={cn(buttonVariants({ variant: 'default' }), "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl flex items-center gap-2 font-bold cursor-pointer justify-center w-full py-2.5 shadow-lg shadow-indigo-600/10 h-auto")}>
            <PlusCircle className="h-5 w-5" />
            <span>Daftarkan Event Baru</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
