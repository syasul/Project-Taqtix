'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Store,
  Ticket,
  Sparkles,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Coins,
  Receipt,
  User,
  Phone,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface TicketCat {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

interface FacItem {
  id: string;
  name: string;
  price: number;
  quota: number | null;
  sold: number;
}

interface CartItem {
  type: 'ticket' | 'facility';
  refId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

export default function PosTerminalPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [ticketCategories, setTicketCategories] = useState<TicketCat[]>([]);
  const [facilities, setFacilities] = useState<FacItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result Modal
  const [successData, setSuccessData] = useState<{
    posTransaction: any;
    tickets: any[];
  } | null>(null);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [catRes, facRes] = await Promise.all([
        apiClient.get(`/events/${eventId}/ticket-categories`),
        apiClient.get(`/organizer/events/${eventId}/facilities`),
      ]);
      setTicketCategories(catRes.data?.data || catRes.data || []);
      setFacilities(facRes.data?.data || facRes.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat katalog POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchCatalog();
  }, [eventId]);

  const addToCart = (type: 'ticket' | 'facility', item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.refId === item.id && c.type === type);
      if (existing) {
        return prev.map((c) =>
          c.refId === item.id && c.type === type ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          type,
          refId: item.id,
          name: item.name,
          unitPrice: item.price,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (refId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.refId === refId) {
            const newQty = c.qty + delta;
            return newQty > 0 ? { ...c, qty: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg('');
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/organizer/events/${eventId}/pos/transaction`, {
        items: cart,
        paymentMethod,
        buyerName: buyerName.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
      });

      setSuccessData(res.data?.data || res.data);
      clearCart();
      setBuyerName('');
      setBuyerPhone('');
      fetchCatalog();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal memproses transaksi POS');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Daftar Event', href: '/dashboard/events' },
    { label: 'Point of Sales (POS)' },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbs} />

      <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Column: Catalog */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-[#08B4B5]" />
              POS Kasir On-site
            </h2>
            <span className="text-xs font-mono font-bold bg-teal-50 text-[#08B4B5] border border-[#08B4B5]/30 px-2.5 py-1 rounded-lg">
              Mode Kasir Cepat
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Kategori Tiket */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <Ticket className="h-3.5 w-3.5 text-[#08B4B5]" />
                  Kategori Tiket
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ticketCategories.map((cat) => {
                    const remaining = cat.quota - cat.sold;
                    const isSoldOut = remaining <= 0;

                    return (
                      <button
                        key={cat.id}
                        disabled={isSoldOut}
                        onClick={() => addToCart('ticket', cat)}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSoldOut
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : 'bg-slate-50 border-slate-200 hover:border-[#08B4B5] hover:bg-white active:scale-[0.98]'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {cat.name}
                          </h4>
                          <p className="text-sm font-black text-emerald-600 mt-1 font-mono">
                            {cat.price > 0
                              ? `Rp ${cat.price.toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-3 block font-medium">
                          {isSoldOut ? 'Habis (Sold Out)' : `Sisa ${remaining} tiket`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fasilitas / Addons */}
              {facilities.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Fasilitas & Merchandise (Add-ons)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {facilities.map((fac) => (
                      <button
                        key={fac.id}
                        onClick={() => addToCart('facility', fac)}
                        className="p-4 rounded-xl border bg-slate-50 border-slate-200 hover:border-amber-500 hover:bg-white active:scale-[0.98] text-left transition flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {fac.name}
                          </h4>
                          <p className="text-sm font-black text-amber-600 mt-1 font-mono">
                            {fac.price > 0
                              ? `Rp ${fac.price.toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-3 block font-medium">
                          {fac.quota !== null ? `Sisa ${fac.quota - fac.sold}` : 'Unlimited'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cart & Instant Checkout */}
        <div className="w-full md:w-96 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#08B4B5]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Keranjang Kasir ({cart.reduce((a, c) => a + c.qty, 0)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6">
                <ShoppingCart className="h-8 w-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Keranjang kosong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih tiket atau fasilitas di sebelah kiri untuk menambahkan.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.type}_${item.refId}`}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Rp {item.unitPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(item.refId, -1)}
                      className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-900 w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.refId, 1)}
                      className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Info (Optional) & Payment Method */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama (Opsional)"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:outline-none"
              />
              <input
                type="tel"
                placeholder="No. WA (Opsional)"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:border-[#08B4B5] focus:outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Cash / Tunai', icon: Coins },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'debit', label: 'Debit / EDC', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-[#08B4B5] text-[#08B4B5]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Total & Checkout Button */}
            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Bayar:</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full py-3 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer border-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              <span>Selesaikan Transaksi (Rp {totalAmount.toLocaleString('id-ID')})</span>
            </button>
          </div>
        </div>

        {/* Success Modal with Issued Tickets */}
        <Dialog open={Boolean(successData)} onOpenChange={() => setSuccessData(null)}>
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Transaksi POS Berhasil!
              </DialogTitle>
            </DialogHeader>

            {successData && (
              <div className="space-y-4 mt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Transaksi:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      #{successData.posTransaction.id.substring(0, 10)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Nominal:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      Rp {successData.posTransaction.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-bold uppercase text-[#08B4B5]">
                      {successData.posTransaction.paymentMethod}
                    </span>
                  </div>
                </div>

                {successData.tickets?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tiket Diterbitkan ({successData.tickets.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {successData.tickets.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{t.categoryName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {t.ticketId.substring(0, 12)}...
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            VALID
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSuccessData(null)}
                  className="w-full py-2.5 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm border-0"
                >
                  Tutup & Transaksi Baru
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
