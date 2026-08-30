'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Download, Search, Users, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => router.push('/dashboard/events')}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl -ml-2 gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Event</span>
        </Button>

        {buyers.length > 0 && (
          <Button
            onClick={handleExportCsv}
            disabled={exporting}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-755 hover:border-transparent rounded-xl gap-2 font-bold cursor-pointer text-xs py-2 px-4 shadow-lg active:scale-[0.98]"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-indigo-400" />
            )}
            <span>Export CSV</span>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Database Pembeli Tiket
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Lihat riwayat pembelian, status, nama peserta, dan kontak pembeli untuk manajemen audience.
        </p>
      </div>

      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama, email, whatsapp pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/30 pl-10 pr-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs backdrop-blur-sm transition"
          />
        </div>

        {/* Database Table */}
        <Card className="bg-slate-900/40 border-slate-855 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-400 text-xs">
                Gagal memuat database pembeli.
              </div>
            ) : filteredBuyers.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Tidak ada data pembeli ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto text-slate-300">
                <Table className="min-w-full text-xs">
                  <TableHeader className="bg-slate-950/40 border-b border-slate-855">
                    <TableRow className="border-b border-slate-855">
                      <TableHead className="py-4 px-6 text-slate-400">Pembeli</TableHead>
                      <TableHead className="py-4 px-4 text-slate-400">Detail Pembelian</TableHead>
                      <TableHead className="py-4 px-4 text-slate-400">Total Belanja</TableHead>
                      <TableHead className="py-4 px-6 text-slate-400">Waktu Pembelian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuyers.map((buyer) => {
                      const formattedDate = format(new Date(buyer.purchaseDate), 'd MMM yyyy, HH:mm', {
                        locale: localeId,
                      });

                      return (
                        <TableRow key={buyer.orderId} className="border-b border-slate-855/50 hover:bg-slate-900/20 transition">
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col space-y-1">
                              <span className="font-bold text-slate-200 text-sm">{buyer.buyerName}</span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-450">
                                <Mail className="h-3 w-3" />
                                <span>{buyer.buyerEmail}</span>
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-455">
                                <Phone className="h-3 w-3" />
                                <span>{buyer.buyerPhone || '-'}</span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              {buyer.items.map((item, idx) => (
                                <span key={idx} className="font-medium text-slate-350">
                                  {item.ticketCategory} x {item.qty}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 font-mono font-semibold text-indigo-400">
                            {buyer.totalAmount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[10px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
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
