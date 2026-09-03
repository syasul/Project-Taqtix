'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle2,
  Ticket,
  Radio,
  Clock,
  Activity,
  Zap,
  ShieldCheck,
  CreditCard,
  Banknote,
  Search,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import EventTabs from '@/components/layout/event-tabs';

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

export default function LiveAttendanceOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const [searchTicket, setSearchTicket] = useState('');

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

  // Simulated live gate status & POS on-site for D-Day
  const gates = [
    { name: 'Gate A - Utama', scanned: Math.floor((stats?.totalTicketsCheckedIn || 0) * 0.45), status: 'Normal', staff: 'Andi & Budi' },
    { name: 'Gate B - VIP & Media', scanned: Math.floor((stats?.totalTicketsCheckedIn || 0) * 0.25), status: 'Lancar', staff: 'Dewi S.' },
    { name: 'Gate C - Penukaran Wristband', scanned: Math.floor((stats?.totalTicketsCheckedIn || 0) * 0.3), status: 'Padat', staff: 'Rian & Tim' },
  ];

  const rundownItems = [
    { time: '08:00 - 09:30', title: 'Open Gate & Scan Tiket Masuk', status: 'Selesai' },
    { time: '09:30 - 11:30', title: 'Sesi Pembukaan & Keynote Speaker', status: 'Sedang Berlangsung' },
    { time: '11:30 - 13:00', title: 'Ishoma & Pameran Booth', status: 'Mendatang' },
    { time: '13:00 - 16:30', title: 'Sesi Inti & Doorprize Utama', status: 'Mendatang' },
  ];

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: stats?.eventTitle || 'Event', href: `/dashboard/events/${eventId}/sales` },
    { label: 'Overview Hari H' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />
      <EventTabs eventId={eventId} />

      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#08B4B5]" />
            Overview Hari H (Live Command Center)
          </h1>
          {stats && (
            <p className="text-xs text-slate-500 mt-1">
              Event: <span className="font-bold text-slate-700">{stats.eventTitle}</span> • Monitoring real-time seluruh pintu masuk & operasional
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-bold text-[10px] tracking-wider uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistem Live 5s Polling</span>
          </div>
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
        <>
          {/* Main Key Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white border-t-4 border-t-[#08B4B5] border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Hadir di Lokasi
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#08B4B5] font-mono">
                  {stats?.totalTicketsCheckedIn.toLocaleString()}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  / {stats?.totalTicketsIssued.toLocaleString()}
                </span>
              </div>
              <Progress value={stats?.attendanceRate || 0} className="h-2 rounded-full bg-slate-100" />
              <p className="text-[10px] text-slate-500 font-bold">{stats?.attendanceRate}% rasio kehadiran</p>
            </div>

            <div className="p-5 bg-white border-t-4 border-t-emerald-500 border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kecepatan Scan Masuk
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-600 font-mono">
                  ~18
                </span>
                <span className="text-slate-400 text-xs">orang / menit</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Arus gate stabil & lancar
              </p>
            </div>

            <div className="p-5 bg-white border-t-4 border-t-amber-500 border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Staf On Duty (Gate & POS)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 font-mono">12</span>
                <span className="text-slate-400 text-xs">crew aktif</span>
              </div>
              <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Semua titik pos terisi
              </p>
            </div>

            <div className="p-5 bg-white border-t-4 border-t-blue-500 border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Penjualan On-Site (Hari H)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">Rp 4.5M</span>
                <span className="text-slate-400 text-xs">POS Cash/QRIS</span>
              </div>
              <p className="text-[10px] text-blue-700 font-semibold">32 tiket terjual di venue</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Gate Status & Breakdown */}
            <div className="md:col-span-7 space-y-6">
              {/* Gate Monitoring */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#08B4B5]" />
                  Status Pintu Masuk (Gate Real-Time)
                </h3>

                <div className="space-y-3">
                  {gates.map((g) => (
                    <div
                      key={g.name}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{g.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PIC / Staf: {g.staff}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {g.scanned.toLocaleString()} scan
                        </span>
                        <span
                          className={`block text-[10px] font-bold ${
                            g.status === 'Padat'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          ● {g.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rundown Acara Live */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#08B4B5]" />
                  Rundown Acara Hari H
                </h3>

                <div className="space-y-2.5">
                  {rundownItems.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        r.status === 'Sedang Berlangsung'
                          ? 'bg-[#08B4B5]/5 border-[#08B4B5]/40 text-[#08B4B5]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[11px] text-slate-400">{r.time}</span>
                        <span className="font-bold text-slate-900">{r.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'Sedang Berlangsung'
                            ? 'bg-[#08B4B5] text-white animate-pulse'
                            : r.status === 'Selesai'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Breakdown per category */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#08B4B5]" />
                  <span>Kehadiran per Kategori Tiket</span>
                </h3>

                {breakdown.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl">
                    Kategori tiket tidak terdaftar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {breakdown.map((item) => (
                      <div
                        key={item.ticketCategoryId}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
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
                        <Progress value={item.attendanceRate} className="h-2 rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
