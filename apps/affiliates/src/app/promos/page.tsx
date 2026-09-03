'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  TicketPercent,
  Copy,
  Check,
  Search,
  ExternalLink,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { initialAffiliateEvents } from '@/lib/data';
import { toast } from 'sonner';

export default function AffiliatePromosManagementPage() {
  const [events] = useState(initialAffiliateEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = events.filter(
    (e) =>
      e.promoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Kode promo ${code} disalin ke clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#08B4B5]" />
            Manajemen Kode Promo Afiliasi
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Lihat semua kode promo yang Anda miliki di platform Taqtix beserta data penjualan tiket dan komisi yang dihasilkan.
          </p>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span>Ubah / Buat Kode Baru</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari kode promo atau judul event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Kode Promo</th>
                <th className="py-3.5 px-4">Event Terkait</th>
                <th className="py-3.5 px-4">Diskon Pembeli</th>
                <th className="py-3.5 px-4">Komisi Anda</th>
                <th className="py-3.5 px-4">Pembeli (Orang)</th>
                <th className="py-3.5 px-4">Tiket Terjual</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-sm text-[#08B4B5] bg-[#08B4B5]/10 px-2.5 py-1 rounded-lg border border-[#08B4B5]/20">
                      {evt.promoCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 line-clamp-1">
                    {evt.eventTitle}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {evt.discountType === 'percentage'
                        ? `${evt.discountValue}%`
                        : `Rp ${evt.discountValue.toLocaleString('id-ID')}`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    {evt.commissionType === 'percentage'
                      ? `${evt.commissionValue}%`
                      : `Rp ${evt.commissionValue.toLocaleString('id-ID')}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {evt.buyersCount} Orang
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                    {evt.ticketsSold} Lembar
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleCopyCode(evt.promoCode, evt.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedId === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Kode</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
