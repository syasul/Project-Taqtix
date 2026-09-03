'use client';

import React, { useState } from 'react';
import {
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Building,
  CreditCard,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { initialPayouts, AffiliatePayoutRecord } from '@/lib/data';
import { toast } from 'sonner';

export default function AffiliatePayoutsPage() {
  const [payouts, setPayouts] = useState<AffiliatePayoutRecord[]>(initialPayouts);
  const [availableBalance, setAvailableBalance] = useState(2733750);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    bankName: 'BCA',
    accountNumber: '8820192831',
    accountHolder: 'Syamsul Ma’arif',
  });

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(form.amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 50000) {
      toast.error('Minimal penarikan dana adalah Rp 50.000');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Nominal penarikan melebihi saldo komisi yang tersedia');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newPayout: AffiliatePayoutRecord = {
        id: `payout-${Date.now().toString().slice(-4)}`,
        amount: withdrawAmount,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountHolder: form.accountHolder,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      setPayouts([newPayout, ...payouts]);
      setAvailableBalance(availableBalance - withdrawAmount);
      setIsModalOpen(false);
      setSubmitting(false);
      setForm({
        amount: '',
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountHolder: form.accountHolder,
      });
      toast.success('Permohonan penarikan dana berhasil diajukan!');
    }, 600);
  };

  const totalPaidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#08B4B5]" />
            Pencairan Komisi Afiliasi
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tarik komisi hasil penjualan tiket ke rekening bank Anda dengan mudah, aman, dan transparan.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={availableBalance < 50000}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Tarik Komisi Sekarang</span>
        </button>
      </div>

      {/* Balance & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-white to-teal-50/40 border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saldo Komisi Siap Tarik
          </span>
          <p className="text-3xl font-black text-emerald-600 font-mono">
            Rp {availableBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500">Minimal penarikan dana Rp 50.000</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Berhasil Dicairkan
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            Rp {totalPaidOut.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500">Telah ditransfer ke rekening Anda</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Waktu Pemrosesan Transfer
          </span>
          <p className="text-2xl font-black text-[#08B4B5] font-mono mt-1">1 x 24 Jam</p>
          <p className="text-[11px] text-slate-500">Senin - Jumat (Hari Kerja)</p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#08B4B5]" />
            <span>Riwayat Permohonan Pencairan</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{payouts.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal Permohonan</th>
                <th className="py-3.5 px-4">Nominal Ditarik</th>
                <th className="py-3.5 px-4">Rekening Tujuan</th>
                <th className="py-3.5 px-4">Status Pencairan</th>
                <th className="py-3.5 px-4">Keterangan Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(p.requestedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                    Rp {p.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">
                      {p.bankName} - {p.accountNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-normal">
                      a.n {p.accountHolder}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.status === 'paid' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Ditransfer (Selesai)
                      </span>
                    )}
                    {p.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Sedang Diproses
                      </span>
                    )}
                    {p.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        Ditolak
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-500">
                    {p.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#08B4B5]" />
                Formulir Penarikan Dana Komisi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-slate-500">Saldo Tersedia:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  Rp {availableBalance.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Penarikan (Rp) *</label>
                <input
                  type="number"
                  min="50000"
                  max={availableBalance}
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Contoh: 500000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-900 font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Bank *</label>
                  <select
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="BSI">BSI (Syariah)</option>
                    <option value="Bank Jago">Bank Jago</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Rekening *</label>
                  <input
                    type="text"
                    required
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="Contoh: 1234567890"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pemilik Rekening *</label>
                <input
                  type="text"
                  required
                  value={form.accountHolder}
                  onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                  placeholder="Sesuai nama di buku tabungan"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-[#08B4B5] focus:outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Ajukan Penarikan Dana</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
