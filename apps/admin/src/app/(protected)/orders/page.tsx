'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Hash,
  FileSearch,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name?: string;
  categoryName?: string;
  qty: number;
  price?: number;
  unitPrice?: number;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
}

interface Order {
  id: string;
  eventTitle: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded' | string;
  totalAmount: number;
  discountAmount?: number;
  createdAt: string;
  expiredAt?: string;
  items?: OrderItem[];
}

const formatRupiah = (value: number | undefined | null) => {
  const num = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (isoString: string) => {
  return (
    new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  );
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [markingOrder, setMarkingOrder] = useState<Order | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<Order[]>('/admin/orders'),
  });

  const handleSyncPayment = async (orderId: string) => {
    setSyncingId(orderId);
    try {
      const res: any = await api.post(`/admin/orders/${orderId}/sync-payment`);
      const status = res?.status || res?.data?.status;
      const gwStatus =
        res?.gatewayResult?.transactionStatus ||
        res?.data?.gatewayResult?.transactionStatus ||
        '';

      if (status === 'paid') {
        toast.success(`Pembayaran terverifikasi di DOKU! Order #${orderId.slice(0, 8)} kini LUNAS.`);
      } else {
        toast.info(
          `Status di gateway DOKU: ${gwStatus || status || 'Belum dibayar'}.`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal sinkronisasi status ke gateway DOKU'
      );
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!markingOrder) return;
    setIsMarking(true);
    try {
      await api.post(`/admin/orders/${markingOrder.id}/mark-paid`);
      toast.success(
        `Order #${markingOrder.id.slice(0, 8)} berhasil ditandai LUNAS dan tiket telah diterbitkan!`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setMarkingOrder(null);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal menandai order sebagai lunas'
      );
    } finally {
      setIsMarking(false);
    }
  };

  // Filter orders by ID, buyerName, buyerEmail, or phone
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const id = (order?.id || '').toLowerCase();
    const buyerName = (order?.buyerName || order?.items?.[0]?.attendeeName || '').toLowerCase();
    const buyerEmail = (order?.buyerEmail || '').toLowerCase();
    const buyerPhone = order?.buyerPhone || order?.items?.[0]?.attendeePhone || '';
    const eventTitle = (order?.eventTitle || (order as any)?.event?.title || '').toLowerCase();

    return (
      id.includes(term) ||
      buyerName.includes(term) ||
      buyerEmail.includes(term) ||
      buyerPhone.includes(term) ||
      eventTitle.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-[#08B4B5]" />
          Pencarian Transaksi & Order Tiket
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Cari tiket pembeli berdasarkan ID pesanan, nama pembeli, email, atau nomor telepon untuk kebutuhan customer support.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl relative shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Masukkan Order ID, email pembeli, nama pembeli, atau judul event..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white transition-all text-xs"
        />
      </div>

      {/* List of Orders */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-[#08B4B5]/20 border-t-[#08B4B5] rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data order...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm">
            Tidak ada transaksi yang sesuai untuk pencarian &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Hash className="w-4 h-4 text-[#08B4B5]" />
                    <span>Order ID: {order.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Dipesan pada: {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'paid'
                          ? 'bg-emerald-500'
                          : order.status === 'pending'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    {order.status === 'paid' ? 'LUNAS' : order.status === 'pending' ? 'PENDING' : order.status}
                  </span>

                  {order.status !== 'paid' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSyncPayment(order.id)}
                        disabled={syncingId === order.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition disabled:opacity-50"
                        title="Cek status transaksi langsung ke gateway DOKU"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 text-[#08B4B5] ${
                            syncingId === order.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{syncingId === order.id ? 'Mengecek...' : 'Cek Status DOKU'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMarkingOrder(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition"
                        title="Tandai pesanan lunas secara manual dan terbitkan e-tiket"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tandai Lunas</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Buyer Details */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Informasi Pembeli
                  </span>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900">
                        {order.buyerName || order.items?.[0]?.attendeeName || 'Pembeli'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.buyerEmail || order.items?.[0]?.attendeeEmail || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">
                        {order.buyerPhone || order.items?.[0]?.attendeePhone || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Event Yang Dipesan
                  </span>
                  <div className="text-slate-800 font-bold text-sm">
                    {order.eventTitle}
                  </div>
                </div>

                {/* Pricing / Total */}
                <div className="space-y-1 md:text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Pembayaran
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {formatRupiah(order.totalAmount)}
                  </div>
                  {(Number(order.discountAmount) || 0) > 0 && (
                    <div className="text-xs text-emerald-600 font-semibold">
                      Diskon: -{formatRupiah(order.discountAmount)}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Wrapper */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Rincian Item Tiket
                </span>
                <div className="space-y-1.5">
                  {(order.items || []).map((item, idx) => {
                    const itemName = item.name || item.categoryName || 'Item Tiket';
                    const itemQty = Number(item.qty) || 1;
                    const unitPrice =
                      typeof item.price === 'number' && !isNaN(item.price)
                        ? item.price
                        : typeof item.unitPrice === 'number' && !isNaN(item.unitPrice)
                        ? item.unitPrice
                        : 0;
                    const subtotal = unitPrice * itemQty;

                    return (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-center text-xs text-slate-700 font-mono"
                      >
                        <span>
                          {itemName} <strong className="text-slate-500 font-bold">x{itemQty}</strong>
                        </span>
                        <span className="font-bold">{formatRupiah(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Konfirmasi Tandai Lunas Manual */}
      {markingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setMarkingOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Tandai Lunas
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Order ID: {markingOrder.id}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Event:</span>
                <span className="font-bold text-slate-900 text-right">{markingOrder.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pembeli:</span>
                <span className="font-semibold text-slate-800">
                  {markingOrder.buyerName || markingOrder.items?.[0]?.attendeeName || 'Pembeli'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Nominal:</span>
                <span className="font-bold text-emerald-600">{formatRupiah(markingOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Tindakan ini akan langsung mengubah status order menjadi <strong>LUNAS</strong> dan <strong>menerbitkan e-tiket resmi</strong> kepada pembeli. Pastikan dana telah Anda verifikasi di mutasi bank/DOKU.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMarkingOrder(null)}
                disabled={isMarking}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkPaid}
                disabled={isMarking}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isMarking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Verifikasi & Tandai Lunas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
