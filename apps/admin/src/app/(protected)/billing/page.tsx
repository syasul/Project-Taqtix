'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface BillingRecord {
  id: string;
  name: string;
  email: string;
  plan: string;
  segment: string;
  status: 'active' | 'expired';
  planStartedAt: string | null;
  planExpiresAt: string | null;
}

export default function BillingOversightPage() {
  const { data: records = [], isLoading } = useQuery<BillingRecord[]>({
    queryKey: ['admin-billing'],
    queryFn: () => api.get<BillingRecord[]>('/admin/billing'),
  });

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-rose-50 text-rose-700 border border-rose-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-[#08B4B5]" />
          Pengawasan Billing & Subscription
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau durasi masa aktif paket plan, rekap kedaluwarsa layanan, dan status tier langganan organizer.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat rekap billing...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Belum ada rekap billing terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Nama Penyelenggara</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Paket Plan</th>
                  <th className="p-4">Segment</th>
                  <th className="p-4">Status Layanan</th>
                  <th className="p-4">Mulai Aktif</th>
                  <th className="p-4">Habis Masa Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{rec.name}</td>
                    <td className="p-4 text-slate-600">{rec.email}</td>
                    <td className="p-4 uppercase font-bold text-xs text-slate-800">{rec.plan}</td>
                    <td className="p-4 capitalize text-slate-600">{rec.segment.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(rec.status)}`}>
                        {rec.status === 'active' ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        {rec.status === 'active' ? 'Aktif' : 'Expired'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {rec.planStartedAt ? new Date(rec.planStartedAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className={`p-4 font-mono font-bold ${rec.status === 'expired' ? 'text-rose-600' : 'text-slate-700'}`}>
                      {rec.planExpiresAt ? new Date(rec.planExpiresAt).toLocaleDateString('id-ID') : '-'}
                    </td>
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
