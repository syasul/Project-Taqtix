import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Halaman checkout tiket pembeli.
 * Dilengkapi dengan quota lock timer, input kode promo/afiliasi, dan rincian harga.
 */
export default function Checkout() {
  const router = useRouter();
  const { id } = router.query;

  // State untuk data pemesanan
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [ticketQty, setTicketQty] = useState(1);

  // Timer kuota terkunci (10 menit)
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ticketPrice = 150000; // IDR 150,000
  const subtotal = ticketPrice * ticketQty;
  const adminFee = 5000;
  const total = subtotal + adminFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Processing payment:', {
      eventId: id,
      buyerName,
      buyerEmail,
      promoCode,
      affiliateCode,
      qty: ticketQty,
      totalAmount: total,
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <Head>
        <title>Checkout Tiket — TAQtix</title>
        <meta name="description" content="Selesaikan pemesanan tiket event Anda dengan aman dan cepat di TAQtix." />
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Urgency Alert (Quota Lock) */}
        {timeLeft > 0 ? (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900 shadow-sm">
            <span className="text-sm font-medium">
              Selesaikan pemesanan Anda segera! Kuota tiket Anda dikunci sementara selama:
            </span>
            <span className="font-mono font-bold text-lg bg-amber-100 text-amber-950 px-3 py-1 rounded-xl">
              {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-rose-700 text-sm font-medium">
            Waktu pemesanan telah habis. Silakan muat ulang halaman untuk memesan kembali.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Pemesanan */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
                Informasi Pengunjung
              </h2>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Sesuai kartu identitas"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#08B4B5] focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 text-xs font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Alamat Email
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e-ticket akan dikirim ke email ini"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#08B4B5] focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="promo" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Kode Promo
                    </label>
                    <input
                      id="promo"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="PROMO10"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#08B4B5] focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="affiliate" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Kode Afiliasi
                    </label>
                    <input
                      id="affiliate"
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="PARTNERX"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#08B4B5] focus:outline-none focus:ring-2 focus:ring-[#08B4B5]/20 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={timeLeft <= 0}
                    className="w-full flex justify-center py-3.5 px-4 border-0 rounded-xl shadow-sm text-xs font-bold text-white bg-[#08B4B5] hover:bg-[#079b9c] transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider active:scale-[0.98]"
                  >
                    Bayar Sekarang (Midtrans)
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Rincian Pesanan */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
                Rincian Pesanan
              </h2>

              <div className="mb-6">
                <h3 className="font-extrabold text-base text-slate-900">Taqwa Movement Event</h3>
                <p className="text-xs text-slate-500 mt-1">Sabtu, 12 September 2026</p>
                <p className="text-xs text-slate-400">Jakarta Convention Center</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tiket Reguler (x{ticketQty})</span>
                  <span className="font-semibold text-slate-800">
                    {(ticketPrice * ticketQty).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Biaya Administrasi</span>
                  <span className="font-semibold text-slate-800">
                    {adminFee.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div className="border-t border-slate-100 my-4 pt-4 flex items-center justify-between text-base">
                  <span className="font-bold text-slate-800">Total Pembayaran</span>
                  <span className="font-extrabold text-[#08B4B5] text-lg">
                    {total.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
