'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Download, Search, Users, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface BuyerItem {
  ticketCategory: string;
  qty: number;
  price: number;
}

interface BuyerRecord {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalAmount: number;
  purchaseDate: string;
  items: BuyerItem[];
}

export default function BuyersDatabasePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // Fetch Buyers List
  const { data: buyersList, isLoading, error } = useQuery({
    queryKey: ['event-buyers', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizer/events/${eventId}/buyers`);
      return res.data?.data as BuyerRecord[];
    },
    enabled: !!eventId,
  });

  const buyers = buyersList || [];

  const filteredBuyers = buyers.filter(
    (b) =>
      b.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      b.buyerEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.buyerPhone.includes(search)
  );

  // Export to CSV safely using axios blob + client-side link click
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get(`/organizer/events/${eventId}/buyers/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `buyers-event-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Database buyer berhasil di-export ke CSV!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekspor data buyer ke CSV.');
    } finally {
      setExporting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Database Pengunjung & Pembeli' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#08B4B5]" />
            Database Pembeli Tiket
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lihat riwayat pembelian, nama peserta, dan kontak pembeli untuk manajemen audience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {buyers.length > 0 && (
            <Button
              onClick={handleExportCsv}
              disabled={exporting}
              className="bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl gap-2 font-bold cursor-pointer text-xs py-2.5 px-4 shadow-sm active:scale-[0.98] border-0"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export CSV</span>
            </Button>
          )}
          <Button
            onClick={() => router.push('/dashboard/events')}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, whatsapp pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#08B4B5] focus:outline-none text-xs shadow-xs transition"
          />
        </div>

        {/* Database Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm rounded-2xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-500 text-xs">
                Gagal memuat database pembeli.
              </div>
            ) : filteredBuyers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Tidak ada data pembeli ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <Table className="min-w-full">
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="py-3.5 px-6 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Pembeli</TableHead>
                      <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Detail Pembelian</TableHead>
                      <TableHead className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Total Belanja</TableHead>
                      <TableHead className="py-3.5 px-6 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Waktu Pembelian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuyers.map((buyer) => {
                      const formattedDate = format(new Date(buyer.purchaseDate), 'd MMM yyyy, HH:mm', {
                        locale: localeId,
                      });

                      return (
                        <TableRow key={buyer.orderId} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col space-y-1">
                              <span className="font-bold text-slate-900 text-xs">{buyer.buyerName}</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{buyer.buyerEmail}</span>
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{buyer.buyerPhone || '-'}</span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              {buyer.items.map((item, idx) => (
                                <span key={idx} className="font-medium text-slate-700">
                                  {item.ticketCategory} x {item.qty}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                            {buyer.totalAmount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{formattedDate} WIB</span>
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
