'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Search, Calendar, User, Phone, Mail, Hash, FileSearch } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  totalAmount: number;
  discountAmount: number;
  createdAt: string;
  expiredAt: string;
  items: OrderItem[];
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
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

  // Fetch Orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<Order[]>('/admin/orders'),
  });

  // Filter orders by ID, buyerName, buyerEmail, or phone
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(term) ||
      order.buyerName.toLowerCase().includes(term) ||
      order.buyerEmail.toLowerCase().includes(term) ||
      order.buyerPhone.includes(term) ||
      order.eventTitle.toLowerCase().includes(term)
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
                      <span className="font-bold text-slate-900">{order.buyerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.buyerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">{order.buyerPhone}</span>
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
                  {order.discountAmount > 0 && (
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
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-700 font-mono">
                      <span>
                        {item.name} <strong className="text-slate-500 font-bold">x{item.qty}</strong>
                      </span>
                      <span className="font-bold">{formatRupiah(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
