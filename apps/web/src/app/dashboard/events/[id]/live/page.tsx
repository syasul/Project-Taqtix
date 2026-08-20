'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Users, CheckCircle2, Ticket, Radio, ArrowUpRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Nav */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Event</span>
        </Button>

        {/* Live indicator pulsing */}
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/25 rounded-full text-red-400 font-bold text-[10px] tracking-wider uppercase animate-pulse">
          <Radio className="h-3.5 w-3.5" />
          <span>Live Monitoring</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Live Attendance Counter
        </h1>
        {stats && (
          <p className="text-sm text-slate-400 mt-2">
            Event: <span className="font-bold text-slate-350">{stats.eventTitle}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-455 text-xs">
          Gagal memuat status kehadiran real-time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Counter Card */}
          <div className="md:col-span-7 space-y-6">
            <Card className="bg-slate-900/40 border-slate-850 shadow-2xl p-6 text-center space-y-6 border-t-4 border-t-indigo-500">
              <div className="pb-4 border-b border-slate-850/60">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Total Kehadiran (Checked-In)
                </h3>
              </div>

              {/* Big Numbers */}
              <div className="flex justify-center items-baseline gap-2 py-4">
                <span className="text-6xl font-extrabold text-indigo-400 font-mono tracking-tighter">
                  {stats?.totalTicketsCheckedIn}
                </span>
                <span className="text-slate-500 text-lg">/</span>
                <span className="text-slate-400 text-2xl font-bold font-mono">
                  {stats?.totalTicketsIssued}
                </span>
              </div>

              {/* Total attendance rate progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-550">Rasio Kehadiran</span>
                  <span className="text-indigo-400 font-mono">{stats?.attendanceRate}%</span>
                </div>
                <Progress value={stats?.attendanceRate || 0} className="h-3 rounded-full bg-slate-850" />
              </div>

              <div className="pt-2 text-[10px] text-slate-500 font-mono">
                Data diperbarui otomatis setiap 5 detik.
              </div>
            </Card>
          </div>

          {/* Breakdown per category */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-bold text-slate-350 text-sm flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-400" />
              <span>Detail per Kategori Tiket</span>
            </h3>

            {breakdown.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Kategori tiket tidak terdaftar.
              </div>
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <Card key={item.ticketCategoryId} className="bg-slate-900/20 border-slate-850 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{item.ticketCategoryName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.checkedInCount} masuk dari {item.issuedCount} tiket
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {item.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={item.attendanceRate} className="h-2 rounded-full bg-slate-850" />
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
