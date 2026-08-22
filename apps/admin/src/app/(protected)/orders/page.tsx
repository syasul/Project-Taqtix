'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Search, Calendar, User, Phone, Mail, Hash } from 'lucide-react';

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
  return new Date(isoString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Cari Transaksi & Order</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cari tiket pembeli berdasarkan ID pesanan, nama pembeli, email, atau telepon untuk kebutuhan support dan CS.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl relative shadow-sm">
        <Search className="w-5 h-5 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Masukkan Order ID, email pembeli, nama pembeli, atau judul event..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-sm"
        />
      </div>

      {/* List of Orders */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data order...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-white border border-slate-200 rounded-xl shadow-sm">
            Tidak ada transaksi ditemukan untuk pencarian "{searchTerm}".
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>Order ID: {order.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" />
                    Dipesan pada: {formatDate(order.createdAt)}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    order.status === 'paid'
                      ? 'bg-emerald-55 text-emerald-700 border border-emerald-200'
                      : order.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-55 text-red-700 border border-red-200'
                  }`}
                >
                  {order.status === 'paid' ? 'LUNAS' : order.status === 'pending' ? 'PENDING' : order.status}
                </span>
              </div>

              {/* Card Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Buyer Details */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Informasi Pembeli
                  </span>
                  <div className="space-y-1.5 text-slate-650">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-450" />
                      <span className="font-semibold text-slate-800">{order.buyerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-450" />
                      <span>{order.buyerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-450" />
                      <span className="font-mono text-xs">{order.buyerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Event Yang Dipesan
                  </span>
                  <div className="text-slate-700 font-medium">
                    {order.eventTitle}
                  </div>
                </div>

                {/* Pricing / Total */}
                <div className="space-y-2 md:text-right">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Pembayaran
                  </span>
                  <div className="text-xl font-extrabold text-slate-800">
                    {formatRupiah(order.totalAmount)}
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="text-xs text-red-650 font-semibold">
                      Diskon: -{formatRupiah(order.discountAmount)}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Wrapper */}
              <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-lg">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Rincian Item Tiket
                </span>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-650 font-mono">
                      <span>
                        {item.name} <strong className="text-slate-500">x{item.qty}</strong>
                      </span>
                      <span className="font-semibold">{formatRupiah(item.price * item.qty)}</span>
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
