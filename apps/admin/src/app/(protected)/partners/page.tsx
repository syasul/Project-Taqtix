'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { HeartHandshake, Eye, ShoppingCart, Loader2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  uniqueCode: string;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
  createdAt: string;
  event: {
    title: string;
  };
}

export default function PartnersOversightPage() {
  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ['admin-partners'],
    queryFn: () => api.get<Partner[]>('/admin/partners'),
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-red-500" />
          Pengawasan Partner Afiliasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor performa traffic rujukan, konversi tiket, dan nominal bagi-hasil komisi seluruh partner afiliasi global.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat data partner...</span>
          </div>
        ) : partners.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Belum ada partner afiliasi terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="p-4">Nama Partner</th>
                  <th className="p-4">Event Terkait</th>
                  <th className="p-4">Kode Referral</th>
                  <th className="p-4">Total Klik</th>
                  <th className="p-4">Konversi</th>
                  <th className="p-4">Omzet Penjualan</th>
                  <th className="p-4">Komisi Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-55/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="p-4 text-slate-655 font-medium">{p.event.title}</td>
                    <td className="p-4 font-mono text-xs text-indigo-650 font-bold">{p.uniqueCode}</td>
                    <td className="p-4 text-slate-600 font-mono">{p.clicks} Klik</td>
                    <td className="p-4 text-slate-600 font-mono">{p.conversions} Order</td>
                    <td className="p-4 text-slate-700 font-mono font-bold">{formatRupiah(p.revenueGenerated)}</td>
                    <td className="p-4 text-emerald-600 font-mono font-bold">{formatRupiah(p.commissionEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
