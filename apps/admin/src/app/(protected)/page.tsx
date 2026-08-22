'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Percent,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    activeOrganizers: number;
    publishedEvents: number;
    platformRevenue: number;
    feesCollected: number;
    pendingApprovals: number;
    pendingSettlements: number;
  };
  recentSales: {
    name: string;
    sales: number;
    revenue: number;
  }[];
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<DashboardData>('/admin/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Memuat data ringkasan platform...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-150 rounded-xl text-red-650 text-sm max-w-2xl">
        Gagal memuat dashboard. Silakan periksa koneksi atau coba beberapa saat lagi.
      </div>
    );
  }

  const { metrics, recentSales } = data;

  const cardList = [
    {
      title: 'Organizer Aktif',
      value: metrics.activeOrganizers,
      desc: 'Penyelenggara aktif berlisensi',
      icon: Users,
      accentClass: 'border-l-4 border-l-blue-600',
      iconColor: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Event Berlangsung',
      value: metrics.publishedEvents,
      desc: 'Event aktif dipublikasikan',
      icon: Calendar,
      accentClass: 'border-l-4 border-l-emerald-600',
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Volume Penjualan',
      value: formatRupiah(metrics.platformRevenue),
      desc: 'Gross GMV tiket terjual',
      icon: DollarSign,
      accentClass: 'border-l-4 border-l-rose-600',
      iconColor: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Revenue Platform',
      value: formatRupiah(metrics.feesCollected),
      desc: 'Biaya admin platform (5%)',
      icon: Percent,
      accentClass: 'border-l-4 border-l-amber-600',
      iconColor: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Ringkasan Platform</h1>
        <p className="text-xs text-slate-500 mt-1 font-semibold">
          Pantau indikator kinerja utama (KPI), persetujuan baru, dan alur perputaran dana.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardList.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 border border-slate-200/80 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 group ${card.accentClass}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border transition-transform duration-300 group-hover:scale-110 ${card.iconColor}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-800 mt-2">{card.value}</div>
              <span className="text-xs text-slate-400 block mt-1.5 font-medium">{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Urgent Action Section */}
      {(metrics.pendingApprovals > 0 || metrics.pendingSettlements > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.pendingApprovals > 0 && (
            <div className="p-6 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:bg-amber-50 transition-colors duration-200">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100/60 border border-amber-200 text-amber-700 rounded-xl shrink-0 shadow-sm">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">Approval Organizer Tertunda</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Terdapat <strong className="text-amber-900">{metrics.pendingApprovals} organizer baru</strong> yang memerlukan peninjauan lisensi untuk mulai mempublikasikan event.
                  </p>
                </div>
              </div>
              <Link
                href="/organizers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-sm hover:shadow cursor-pointer"
              >
                Tinjau
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {metrics.pendingSettlements > 0 && (
            <div className="p-6 bg-rose-50/50 border border-rose-200/80 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:bg-rose-50 transition-colors duration-200">
              <div className="flex gap-4">
                <div className="p-3 bg-rose-100/60 border border-rose-200 text-rose-700 rounded-xl shrink-0 shadow-sm">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900 text-sm">Pencairan Dana Tertunda</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Terdapat <strong className="text-rose-900">{metrics.pendingSettlements} settlement event selesai</strong> yang memerlukan proses transfer manual & bukti bayar.
                  </p>
                </div>
              </div>
              <Link
                href="/settlements"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-sm hover:shadow cursor-pointer"
              >
                Tinjau
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Sales Trend Chart (Custom CSS SVG Chart) */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-tight">Tren Pendapatan Mingguan</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Akumulasi volume transaksi kotor (GMV) platform.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-650 rounded-full" />
              Volume Transaksi (IDR)
            </span>
          </div>
        </div>

        {/* Custom SVG Area Chart */}
        <div className="w-full h-72 relative flex items-end justify-between gap-2 px-4 border-b border-l border-slate-200/70 pb-3 font-mono text-[10px] text-slate-400">
          {/* Y Axis Grid lines */}
          <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none p-3">
            <div className="border-t border-slate-100/80 w-full" />
            <div className="border-t border-slate-100/80 w-full" />
            <div className="border-t border-slate-100/80 w-full" />
            <div className="border-t border-slate-100/80 w-full" />
            <div className="w-full" /> {/* Bottom axis */}
          </div>

          {/* SVG representation */}
          <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path
              d="M 50 170 L 250 130 L 450 90 L 650 50 L 650 200 L 50 200 Z"
              fill="url(#chartGrad)"
              className="transition-all duration-500"
            />
            {/* Smooth Glowing Line */}
            <path
              d="M 50 170 L 250 130 L 450 90 L 650 50"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />

            {/* White Ring Dots with Crimson Centers */}
            <circle cx="50" cy="170" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer hover:r-8 transition-all" />
            <circle cx="250" cy="130" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer hover:r-8 transition-all" />
            <circle cx="450" cy="90" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer hover:r-8 transition-all" />
            <circle cx="650" cy="50" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer hover:r-8 transition-all" />

            {/* Value Indicators above dots */}
            <text x="50" y="152" fill="#b91c1c" textAnchor="middle" className="text-[10px] font-extrabold font-sans">18jt</text>
            <text x="250" y="112" fill="#b91c1c" textAnchor="middle" className="text-[10px] font-extrabold font-sans">37jt</text>
            <text x="450" y="72" fill="#b91c1c" textAnchor="middle" className="text-[10px] font-extrabold font-sans">57jt</text>
            <text x="650" y="32" fill="#b91c1c" textAnchor="middle" className="text-[10px] font-extrabold font-sans">72jt</text>
          </svg>

          {/* X Axis Labels */}
          <div className="absolute bottom-[-28px] left-0 right-0 flex justify-between px-10 text-slate-500 text-xs font-bold uppercase tracking-wider">
            {recentSales.map((sales, idx) => (
              <span key={idx}>{sales.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
