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
  TrendingUp,
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
        <div className="w-10 h-10 border-4 border-[#08B4B5]/20 border-t-[#08B4B5] rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Memuat data ringkasan platform...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm max-w-2xl">
        Gagal memuat dashboard. Silakan periksa koneksi atau coba beberapa saat lagi.
      </div>
    );
  }

  const { metrics, recentSales } = data;

  const cardList = [
    {
      title: 'Organizer Aktif',
      value: metrics.activeOrganizers,
      desc: 'Penyelenggara terverifikasi',
      icon: Users,
      accentClass: 'border-l-4 border-l-[#08B4B5]',
      iconColor: 'bg-teal-50 text-[#08B4B5] border-[#08B4B5]/20',
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
      accentClass: 'border-l-4 border-l-blue-600',
      iconColor: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Revenue Platform',
      value: formatRupiah(metrics.feesCollected),
      desc: 'Biaya admin platform (5%)',
      icon: Percent,
      accentClass: 'border-l-4 border-l-amber-500',
      iconColor: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Ringkasan Platform</h1>
        <p className="text-xs text-slate-500 mt-1 font-semibold">
          Pantau indikator kinerja utama (KPI), persetujuan baru, dan alur perputaran dana.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardList.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 border border-slate-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-44 group ${card.accentClass}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${card.iconColor}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 mt-2">{card.value}</div>
              <span className="text-xs text-slate-400 block mt-1.5 font-medium">{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Alerts Section */}
      {(metrics.pendingApprovals > 0 || metrics.pendingSettlements > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.pendingApprovals > 0 && (
            <div className="p-5 sm:p-6 bg-white border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Approval Organizer Menunggu</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Terdapat <strong className="text-slate-800">{metrics.pendingApprovals} organizer baru</strong> yang memerlukan peninjauan lisensi untuk mulai mempublikasikan event.
                  </p>
                </div>
              </div>
              <Link
                href="/organizers"
                className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Tinjau
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {metrics.pendingSettlements > 0 && (
            <div className="p-5 sm:p-6 bg-white border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex gap-4">
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pencairan Dana Pending</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Terdapat <strong className="text-slate-800">{metrics.pendingSettlements} settlement event selesai</strong> yang memerlukan verifikasi transfer manual.
                  </p>
                </div>
              </div>
              <Link
                href="/settlements"
                className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Tinjau
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Sales Trend Chart (Solid, Clean white styling) */}
      <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#08B4B5]" />
              Tren Pendapatan Mingguan
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Akumulasi volume transaksi kotor (GMV) platform.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#08B4B5] rounded-full" />
              Volume Transaksi (IDR)
            </span>
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="w-full h-72 relative flex items-end justify-between gap-2 px-4 border-b border-l border-slate-200 pb-3 font-mono text-[10px] text-slate-400">
          {/* Y Axis Grid lines */}
          <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none p-3">
            <div className="border-t border-slate-100 w-full" />
            <div className="border-t border-slate-100 w-full" />
            <div className="border-t border-slate-100 w-full" />
            <div className="border-t border-slate-100 w-full" />
            <div className="w-full" />
          </div>

          {/* SVG representation with solid color */}
          <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" xmlns="http://www.w3.org/2000/svg">
            {/* Smooth Solid Line */}
            <path
              d="M 50 170 L 250 130 L 450 90 L 650 50"
              fill="none"
              stroke="#08B4B5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Solid Ring Dots */}
            <circle cx="50" cy="170" r="6" fill="#08B4B5" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="250" cy="130" r="6" fill="#08B4B5" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="450" cy="90" r="6" fill="#08B4B5" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="650" cy="50" r="6" fill="#08B4B5" stroke="#ffffff" strokeWidth="2.5" />

            {/* Value Indicators above dots */}
            <text x="50" y="150" fill="#08B4B5" textAnchor="middle" className="text-[11px] font-extrabold font-sans">18jt</text>
            <text x="250" y="110" fill="#08B4B5" textAnchor="middle" className="text-[11px] font-extrabold font-sans">37jt</text>
            <text x="450" y="70" fill="#08B4B5" textAnchor="middle" className="text-[11px] font-extrabold font-sans">57jt</text>
            <text x="650" y="30" fill="#08B4B5" textAnchor="middle" className="text-[11px] font-extrabold font-sans">72jt</text>
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
