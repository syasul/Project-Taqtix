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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <Head>
        <title>Checkout Tiket — TAQtix</title>
        <meta name="description" content="Selesaikan pemesanan tiket event Anda dengan aman dan cepat di TAQtix." />
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Urgency Alert (Quota Lock) */}
        {timeLeft > 0 ? (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-amber-400">
            <span className="text-sm font-medium">
              Selesaikan pemesanan Anda segera! Kuota tiket Anda dikunci sementara selama:
            </span>
            <span className="font-mono font-bold text-lg bg-amber-500/20 px-3 py-1 rounded-md animate-pulse">
              {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <div className="mb-8 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center text-rose-400 text-sm font-medium">
            Waktu pemesanan telah habis. Silakan muat ulang halaman untuk memesan kembali.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Pemesanan */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-slate-200 mb-6 pb-2 border-b border-slate-800">
                Informasi Pengunjung
              </h2>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-400">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Sesuai kartu identitas"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-sm font-medium text-slate-400">
                    Alamat Email
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e-ticket akan dikirim ke email ini"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="promo" className="block text-sm font-medium text-slate-400">
                      Kode Promo
                    </label>
                    <input
                      id="promo"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="PROMO10"
                      className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="affiliate" className="block text-sm font-medium text-slate-400">
                      Kode Afiliasi
                    </label>
                    <input
                      id="affiliate"
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="PARTNERX"
                      className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={timeLeft <= 0}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-emerald-600/20 active:scale-[0.98]"
                  >
                    Bayar Sekarang (Midtrans)
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Rincian Pesanan */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-slate-200 mb-6 pb-2 border-b border-slate-800">
                Rincian Pesanan
              </h2>

              <div className="mb-6">
                <h3 className="font-extrabold text-lg text-indigo-400">Taqwa Movement Event</h3>
                <p className="text-xs text-slate-400 mt-1">Sabtu, 12 September 2026</p>
                <p className="text-xs text-slate-500">Jakarta Convention Center</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Tiket Reguler (x{ticketQty})</span>
                  <span className="font-semibold text-slate-200">
                    {(ticketPrice * ticketQty).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Biaya Administrasi</span>
                  <span className="font-semibold text-slate-200">
                    {adminFee.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div className="border-t border-slate-800 my-4 pt-4 flex items-center justify-between text-base">
                  <span className="font-bold text-slate-300">Total Pembayaran</span>
                  <span className="font-extrabold text-emerald-400 text-lg">
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
