'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import EventTabs from '@/components/layout/event-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { 
  UserCheck, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Phone, 
  RefreshCw, 
  Loader2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function WorkforcePicViewPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Polling every 30 seconds
  const { data: dashboardResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['workforce-pic-dashboard', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/workforce/pic-dashboard`);
      setLastRefreshed(new Date());
      return res.data?.data;
    },
    enabled: !!eventId,
    refetchInterval: 30000, // 30 seconds polling auto-refresh
  });

  const dashboard = dashboardResponse || {
    division: 'Divisi Saya',
    expected: 0,
    present: 0,
    late: 0,
    absent: 0,
    members: [],
  };

  const members = dashboard.members || [];
  const unCheckedInMembers = members.filter((m: any) => m.status !== 'present');

  // Format phone for wa.me link: 0812... -> 62812...
  const formatWaUrl = (phone: string, crewName: string) => {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const message = encodeURIComponent(`Halo ${crewName}, apakah sudah berada di venue untuk shift event hari ini?`);
    return `https://wa.me/${clean}?text=${message}`;
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Workforce', href: `/dashboard/events/${eventId}/workforce` },
    { label: 'PIC Real-Time View' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Back button */}
      <div>
        <Link
          href={`/dashboard/events/${eventId}/workforce`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Manajemen Workforce</span>
        </Link>
      </div>

      {/* Header & Polling Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#08B4B5]" />
              Pantauan Real-Time PIC Divisi: <span className="text-[#08B4B5] capitalize">{dashboard.division}</span>
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full animate-pulse">
              LIVE 30s
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data otomatis terfilter khusus untuk divisi yang Anda ampu sebagai PIC bertugas.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[10px] text-slate-400 font-mono">
            Pembaruan: {lastRefreshed.toLocaleTimeString('id-ID')}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
            className="rounded-xl border-slate-200 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin text-[#08B4B5]")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-400">Memuat status kehadiran kru divisi...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Big Numbers Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Expected */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected</span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {dashboard.expected}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Total kru terdaftar</p>
            </Card>

            {/* Present */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600 font-mono">
                {dashboard.present}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Sudah check-in di venue</p>
            </Card>

            {/* Late */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Late</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-600 font-mono">
                {dashboard.late}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Lewat threshold shift</p>
            </Card>

            {/* Absent */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Absent</span>
                <XCircle className="h-4 w-4 text-rose-600" />
              </div>
              <div className="text-3xl font-black text-rose-600 font-mono">
                {dashboard.absent}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Belum hadir sama sekali</p>
            </Card>
          </div>

          {/* Quick-Action: Unchecked-In Members List with WA Direct Call */}
          <Card className="bg-white border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Kru Belum Hadir / Perlu Konfirmasi ({unCheckedInMembers.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Hubungi langsung anggota divisi via WhatsApp untuk konfirmasi posisi perjalanan
                </CardDescription>
              </div>
            </div>

            {unCheckedInMembers.length === 0 ? (
              <div className="p-8 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Seluruh Kru Divisi Telah Hadir!</h4>
                <p className="text-xs text-emerald-700">Semua anggota shift yang dijadwalkan sudah tercheck-in.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {unCheckedInMembers.map((m: any) => (
                  <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{m.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {m.role || 'Volunteer'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500">{m.phone}</p>
                    </div>

                    <a
                      href={formatWaUrl(m.phone, m.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Hubungi via WA</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
