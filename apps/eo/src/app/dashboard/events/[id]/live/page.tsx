'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Users, CheckCircle2, Ticket, Radio, ArrowUpRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface AttendanceBreakdown {
  ticketCategoryId: string;
  ticketCategoryName: string;
  issuedCount: number;
  checkedInCount: number;
  attendanceRate: number;
}

interface AttendanceStats {
  eventId: string;
  eventTitle: string;
  totalTicketsIssued: number;
  totalTicketsCheckedIn: number;
  attendanceRate: number;
  breakdown: AttendanceBreakdown[];
}

export default function LiveAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  // Fetch Live Attendance Stats with 5 seconds short-polling interval
  const { data: attendanceResponse, isLoading, error } = useQuery({
    queryKey: ['live-attendance', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/gate/events/${eventId}/live-count`);
      return res.data?.data as AttendanceStats;
    },
    refetchInterval: 5000,
    enabled: !!eventId,
  });

  const stats = attendanceResponse;
  const breakdown = stats?.breakdown || [];

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: stats?.eventTitle || 'Event', href: `/dashboard/events/${eventId}/sales` },
    { label: 'Live Attendance Gate' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Top Nav */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#08B4B5]" />
            Live Attendance Counter
          </h1>
          {stats && (
            <p className="text-xs text-slate-500 mt-1">
              Event: <span className="font-bold text-slate-700">{stats.eventTitle}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-bold text-[10px] tracking-wider uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Monitoring</span>
          </div>
          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-500 text-xs bg-white border border-slate-200 rounded-2xl shadow-sm">
          Gagal memuat status kehadiran real-time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Main Counter Card */}
          <div className="md:col-span-7 space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm p-6 text-center space-y-6 rounded-2xl border-t-4 border-t-[#08B4B5]">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Kehadiran (Checked-In)
                </h3>
              </div>

              {/* Big Numbers */}
              <div className="flex justify-center items-baseline gap-2 py-4">
                <span className="text-6xl font-black text-[#08B4B5] font-mono tracking-tighter">
                  {stats?.totalTicketsCheckedIn}
                </span>
                <span className="text-slate-300 text-lg">/</span>
                <span className="text-slate-600 text-2xl font-bold font-mono">
                  {stats?.totalTicketsIssued}
                </span>
              </div>

              {/* Total attendance rate progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Rasio Kehadiran</span>
                  <span className="text-[#08B4B5] font-mono font-bold">{stats?.attendanceRate}%</span>
                </div>
                <Progress value={stats?.attendanceRate || 0} className="h-3 rounded-full bg-slate-100" />
              </div>

              <div className="pt-2 text-[10px] text-slate-400 font-mono">
                Data diperbarui otomatis setiap 5 detik.
              </div>
            </Card>
          </div>

          {/* Breakdown per category */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-[#08B4B5]" />
              <span>Detail per Kategori Tiket</span>
            </h3>

            {breakdown.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl shadow-sm">
                Kategori tiket tidak terdaftar.
              </div>
            ) : (
              <div className="space-y-3">
                {breakdown.map((item) => (
                  <Card key={item.ticketCategoryId} className="bg-white border-slate-200 p-4 space-y-2.5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.ticketCategoryName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.checkedInCount} masuk dari {item.issuedCount} tiket
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#08B4B5] font-mono">
                        {item.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={item.attendanceRate} className="h-2 rounded-full bg-slate-100" />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
