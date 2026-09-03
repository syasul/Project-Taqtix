'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Search,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Banknote,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface Settlement {
  id: string;
  eventTitle: string;
  organizerName: string;
  grossRevenue: number;
  platformFee: number;
  affiliateCommissionTotal: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'paid';
  paidAt: string | null;
  paidBy: string | null;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (isoString: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function SettlementsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmPaidModal, setConfirmPaidModal] = useState<{
    id: string;
    eventTitle: string;
    netAmount: number;
  } | null>(null);

  // Fetch Settlements
  const { data: settlements = [], isLoading } = useQuery<Settlement[]>({
    queryKey: ['admin-settlements'],
    queryFn: () => api.get<Settlement[]>('/admin/settlements'),
  });

  // Mark as Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/settlements/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setConfirmPaidModal(null);
      toast.success('Status settlement berhasil ditandai Lunas');
    },
  });

  // Filtering logic
  const filteredSettlements = settlements.filter((set) => {
    const matchesSearch =
      set.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || set.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalPendingPayout = settlements
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + s.netAmount, 0);

  const totalPlatformFees = settlements.reduce((sum, s) => sum + s.platformFee, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Banknote className="w-6 h-6 text-[#08B4B5]" />
          Pencairan Dana (Settlements)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pembagian dana hasil penjualan tiket untuk masing-masing penyelenggara setelah event selesai dilaksanakan.
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pending Payout</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">{formatRupiah(totalPendingPayout)}</div>
            <span className="text-xs text-slate-400 block mt-1">Akumulasi dana yang harus ditransfer ke EO</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Biaya Platform (5%)</span>
            <div className="text-2xl font-extrabold text-[#08B4B5] mt-2">{formatRupiah(totalPlatformFees)}</div>
            <span className="text-xs text-slate-400 block mt-1">Total revenue potongan fee platform</span>
          </div>
          <div className="p-3 bg-teal-50 border border-[#08B4B5]/20 text-[#08B4B5] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari judul event atau organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Sedang Diproses</option>
            <option value="paid">Lunas / Ditransfer</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-[#08B4B5]/20 border-t-[#08B4B5] rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data settlement...</p>
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Tidak ada data settlement ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Event & Organizer</th>
                  <th className="p-4">Gross GMV</th>
                  <th className="p-4">Platform Fee (5%)</th>
                  <th className="p-4">Komisi Affiliate</th>
                  <th className="p-4 font-bold text-slate-900">Net Payout</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettlements.map((set) => (
                  <tr key={set.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Event & EO */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{set.eventTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{set.organizerName}</div>
                    </td>
                    {/* Gross */}
                    <td className="p-4 text-slate-700 font-mono">
                      {formatRupiah(set.grossRevenue)}
                    </td>
                    {/* Platform Fee */}
                    <td className="p-4 text-slate-500 font-mono">
                      {formatRupiah(set.platformFee)}
                    </td>
                    {/* Affiliate */}
                    <td className="p-4 text-slate-500 font-mono">
                      {formatRupiah(set.affiliateCommissionTotal)}
                    </td>
                    {/* Net Payout */}
                    <td className="p-4 font-bold text-slate-900 font-mono">
                      {formatRupiah(set.netAmount)}
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          set.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            set.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {set.status === 'paid' ? `Lunas (${formatDate(set.paidAt)})` : 'Pending'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {set.status !== 'paid' && (
                          <button
                            onClick={() =>
                              setConfirmPaidModal({
                                id: set.id,
                                eventTitle: set.eventTitle,
                                netAmount: set.netAmount,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs border-0"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmPaidModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Konfirmasi Pencairan Dana</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda sudah selesai mentransfer dana secara manual sebesar{' '}
                  <strong className="text-slate-800">{formatRupiah(confirmPaidModal.netAmount)}</strong> kepada penyelenggara{' '}
                  <strong className="text-slate-800">{confirmPaidModal.eventTitle}</strong>?
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Aksi ini akan mencatat akun admin Anda sebagai pemroses settlement.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setConfirmPaidModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                Belum, Batalkan
              </button>
              <button
                onClick={() => markPaidMutation.mutate(confirmPaidModal.id)}
                disabled={markPaidMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {markPaidMutation.isPending ? 'Memproses...' : 'Ya, Sudah Ditransfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
