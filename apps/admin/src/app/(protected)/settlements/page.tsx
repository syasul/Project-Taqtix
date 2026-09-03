'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MockAffiliatePayout } from '@/lib/api/client';
import {
  Search,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Banknote,
  DollarSign,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
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
  const [activeTab, setActiveTab] = useState<'eo' | 'affiliate'>('eo');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmPaidModal, setConfirmPaidModal] = useState<{
    id: string;
    eventTitle: string;
    netAmount: number;
  } | null>(null);

  const [payoutApproveModal, setPayoutApproveModal] = useState<MockAffiliatePayout | null>(null);

  // Fetch EO Settlements
  const { data: settlements = [], isLoading: isSettlementLoading } = useQuery<Settlement[]>({
    queryKey: ['admin-settlements'],
    queryFn: () => api.get<Settlement[]>('/admin/settlements'),
  });

  // Fetch Affiliate Payouts
  const { data: affiliatePayouts = [], isLoading: isPayoutsLoading } = useQuery<MockAffiliatePayout[]>({
    queryKey: ['admin-affiliate-payouts'],
    queryFn: () => api.get<MockAffiliatePayout[]>('/admin/affiliate-payouts'),
  });

  // Mark EO Settlement as Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/settlements/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setConfirmPaidModal(null);
      toast.success('Status settlement EO berhasil ditandai Lunas');
    },
  });

  // Approve Affiliate Payout Mutation
  const approvePayoutMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/affiliate-payouts/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
      setPayoutApproveModal(null);
      toast.success('Pencairan komisi affiliate berhasil disetujui & ditandai Ditransfer');
    },
  });

  // Reject Affiliate Payout Mutation
  const rejectPayoutMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/affiliate-payouts/${id}/reject`, { reason: 'Data rekening tidak sesuai' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
      toast.success('Permintaan pencairan affiliate ditolak');
    },
  });

  // Filtering EO settlements
  const filteredSettlements = settlements.filter((set) => {
    const matchesSearch =
      set.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || set.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtering Affiliate payouts
  const filteredPayouts = affiliatePayouts.filter((p) => {
    const matchesSearch =
      p.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendingPayout = settlements
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + s.netAmount, 0);

  const totalPendingAffiliate = affiliatePayouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Banknote className="w-6 h-6 text-[#08B4B5]" />
          Pencairan Dana (Settlements & Payouts)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pembagian dana bagi hasil penjualan tiket untuk penyelenggara event dan pencairan komisi partner afiliasi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => {
            setActiveTab('eo');
            setStatusFilter('all');
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'eo'
              ? 'border-[#08B4B5] text-[#08B4B5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Settlement Penyelenggara (EO)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('affiliate');
            setStatusFilter('all');
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'affiliate'
              ? 'border-[#08B4B5] text-[#08B4B5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Pencairan Komisi Affiliate</span>
          {affiliatePayouts.filter((p) => p.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {affiliatePayouts.filter((p) => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {activeTab === 'eo' ? 'Pending Settlement EO' : 'Pending Penarikan Affiliate'}
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
              {formatRupiah(activeTab === 'eo' ? totalPendingPayout : totalPendingAffiliate)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {activeTab === 'eo' ? 'Total Transaksi EO' : 'Total Permintaan Tarik'}
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {activeTab === 'eo' ? settlements.length : affiliatePayouts.length}
            </p>
          </div>
          <div className="p-3 bg-[#08B4B5]/10 rounded-xl text-[#08B4B5] border border-[#08B4B5]/20">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Pemrosesan</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">Lancar (Real-time)</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'eo'
                ? 'Cari event atau nama organizer...'
                : 'Cari nama partner, kode afiliasi, atau bank...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition-all"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Lunas / Ditransfer</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* TAB CONTENT 1: EO SETTLEMENTS */}
      {activeTab === 'eo' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {isSettlementLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
              <p className="text-slate-500 text-xs font-medium">Memuat data settlement...</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data settlement EO.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Event & Penyelenggara</th>
                    <th className="p-4">Total Penjualan Kotor</th>
                    <th className="p-4">Biaya Platform</th>
                    <th className="p-4">Komisi Affiliate</th>
                    <th className="p-4">Dana Bersih (Net)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSettlements.map((set) => (
                    <tr key={set.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{set.eventTitle}</div>
                        <div className="text-[11px] text-slate-400">{set.organizerName}</div>
                      </td>
                      <td className="p-4 font-mono">{formatRupiah(set.grossRevenue)}</td>
                      <td className="p-4 font-mono text-rose-600">-{formatRupiah(set.platformFee)}</td>
                      <td className="p-4 font-mono text-amber-600">
                        -{formatRupiah(set.affiliateCommissionTotal)}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">{formatRupiah(set.netAmount)}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            set.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {set.status === 'paid' ? `Lunas (${formatDate(set.paidAt)})` : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {set.status !== 'paid' && (
                          <button
                            onClick={() =>
                              setConfirmPaidModal({
                                id: set.id,
                                eventTitle: set.eventTitle,
                                netAmount: set.netAmount,
                              })
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: AFFILIATE PAYOUTS */}
      {activeTab === 'affiliate' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {isPayoutsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-[#08B4B5] animate-spin" />
              <p className="text-slate-500 text-xs font-medium">Memuat data pencairan affiliate...</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Tidak ada permohonan pencairan komisi affiliate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Partner Afiliasi</th>
                    <th className="p-4">Nominal Penarikan</th>
                    <th className="p-4">Rekening Tujuan</th>
                    <th className="p-4">Tanggal Permohonan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{payout.partnerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {payout.uniqueCode} • {payout.partnerEmail}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(payout.amount)}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {payout.bankName} - {payout.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">a.n {payout.accountHolder}</div>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(payout.requestedAt)}</td>
                      <td className="p-4">
                        {payout.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Transfer
                          </span>
                        )}
                        {payout.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Berhasil Ditransfer
                          </span>
                        )}
                        {payout.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {payout.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPayoutApproveModal(payout)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui & Transfer</span>
                            </button>
                            <button
                              onClick={() => rejectPayoutMutation.mutate(payout.id)}
                              disabled={rejectPayoutMutation.isPending}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM AFFILIATE PAYOUT MODAL */}
      {payoutApproveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Konfirmasi Pencairan Komisi</h3>
                <p className="text-xs text-slate-500">{payoutApproveModal.partnerName}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Penarikan:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(payoutApproveModal.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank & Rekening:</span>
                <span className="font-bold text-slate-900">
                  {payoutApproveModal.bankName} - {payoutApproveModal.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Penerima:</span>
                <span className="font-bold text-slate-900">{payoutApproveModal.accountHolder}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Pastikan Anda telah melakukan transfer ke rekening di atas sebelum menandai permohonan ini sebagai selesai.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPayoutApproveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => approvePayoutMutation.mutate(payoutApproveModal.id)}
                disabled={approvePayoutMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                {approvePayoutMutation.isPending ? 'Memproses...' : 'Ya, Sudah Ditransfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EO SETTLEMENT MODAL */}
      {confirmPaidModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Konfirmasi Pencairan Dana EO</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apakah Anda sudah selesai mentransfer dana secara manual sebesar{' '}
                  <strong className="text-slate-800">{formatRupiah(confirmPaidModal.netAmount)}</strong> kepada penyelenggara{' '}
                  <strong className="text-slate-800">{confirmPaidModal.eventTitle}</strong>?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setConfirmPaidModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => markPaidMutation.mutate(confirmPaidModal.id)}
                disabled={markPaidMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer shadow-xs"
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
