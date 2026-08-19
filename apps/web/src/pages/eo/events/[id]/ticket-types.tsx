import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  soldCount: number;
  saleStart: string;
  saleEnd: string;
}

const mockTicketTypes: TicketType[] = [
  {
    id: 't1',
    name: 'Early Bird',
    price: 100000,
    quota: 100,
    soldCount: 100,
    saleStart: '2026-08-01',
    saleEnd: '2026-08-15',
  },
  {
    id: 't2',
    name: 'Regular Ticket',
    price: 150000,
    quota: 500,
    soldCount: 145,
    saleStart: '2026-08-16',
    saleEnd: '2026-09-10',
  },
  {
    id: 't3',
    name: 'VIP Experience',
    price: 350000,
    quota: 50,
    soldCount: 12,
    saleStart: '2026-08-16',
    saleEnd: '2026-09-10',
  },
];

/**
 * Halaman manajemen tipe tiket event oleh Event Organizer (EO).
 * Memungkinkan EO untuk menambah, merubah, dan memonitor kuota penjualan tiket per kategori.
 */
export default function TicketTypes() {
  const router = useRouter();
  const { id } = router.query;

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(mockTicketTypes);

  // Form states untuk penambahan kategori tiket baru
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [quota, setQuota] = useState(0);
  const [saleStart, setSaleStart] = useState('');
  const [saleEnd, setSaleEnd] = useState('');

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: TicketType = {
      id: `t${Date.now()}`,
      name,
      price,
      quota,
      soldCount: 0,
      saleStart,
      saleEnd,
    };
    setTicketTypes((prev) => [...prev, newTicket]);
    // reset form
    setName('');
    setPrice(0);
    setQuota(0);
    setSaleStart('');
    setSaleEnd('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <Head>
        <title>Kelola Kategori Tiket — EO Dashboard</title>
        <meta name="description" content="Dashboard Event Organizer untuk mengatur tipe tiket, harga, dan kuota penjualan." />
      </Head>

      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Kelola Tipe Tiket Event
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Event ID: <span className="font-mono text-slate-300 font-semibold">{id || 'Taqwa Movement'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List Tipe Tiket */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">
                Kategori Tiket Saat Ini
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-medium">
                      <th className="py-3 px-2">Nama Kategori</th>
                      <th className="py-3 px-2">Harga</th>
                      <th className="py-3 px-2">Terjual / Kuota</th>
                      <th className="py-3 px-2">Periode Penjualan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketTypes.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition">
                        <td className="py-4 px-2 font-bold text-slate-200">{ticket.name}</td>
                        <td className="py-4 px-2 font-mono text-emerald-400">
                          {ticket.price.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-300">
                              {ticket.soldCount} / {ticket.quota}
                            </span>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${Math.min((ticket.soldCount / ticket.quota) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-400 font-mono">
                          {ticket.saleStart} s/d {ticket.saleEnd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Tambah Tiket */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-slate-200 mb-6 pb-2 border-b border-slate-800">
                Tambah Tipe Tiket Baru
              </h2>
              <form onSubmit={handleAddTicket} className="space-y-4">
                <div>
                  <label htmlFor="ticketName" className="block text-sm font-medium text-slate-400">
                    Nama Kategori Tiket
                  </label>
                  <input
                    id="ticketName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: VIP Pass, Reguler"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ticketPrice" className="block text-sm font-medium text-slate-400">
                    Harga Tiket (Rp)
                  </label>
                  <input
                    id="ticketPrice"
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="ticketQuota" className="block text-sm font-medium text-slate-400">
                    Kuota Penjualan
                  </label>
                  <input
                    id="ticketQuota"
                    type="number"
                    required
                    value={quota}
                    onChange={(e) => setQuota(Number(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="startSale" className="block text-sm font-medium text-slate-400">
                    Mulai Penjualan
                  </label>
                  <input
                    id="startSale"
                    type="date"
                    required
                    value={saleStart}
                    onChange={(e) => setSaleStart(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="endSale" className="block text-sm font-medium text-slate-400">
                    Selesai Penjualan
                  </label>
                  <input
                    id="endSale"
                    type="date"
                    required
                    value={saleEnd}
                    onChange={(e) => setSaleEnd(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition duration-150 cursor-pointer shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    Simpan Tipe Tiket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
