import React, { useState } from 'react';
import Head from 'next/head';

interface PendingEvent {
  id: string;
  title: string;
  organizer: string;
  category: string;
  date: string;
  location: string;
  priceRange: string;
}

const mockEvents: PendingEvent[] = [
  {
    id: '1',
    title: 'Taqwa Movement Concert 2026',
    organizer: 'Taqwa Media Group',
    category: 'Religi & Musik',
    date: '2026-09-12',
    location: 'Jakarta Convention Center',
    priceRange: 'Rp150.000 - Rp500.000',
  },
  {
    id: '2',
    title: 'Startup Growth Summit 2026',
    organizer: 'IndoTech Community',
    category: 'Teknologi & Bisnis',
    date: '2026-10-05',
    location: 'ICE BSD, Tangerang',
    priceRange: 'Rp350.000 - Rp1.200.000',
  },
  {
    id: '3',
    title: 'Ramadhan Food Festival',
    organizer: 'Asosiasi UMKM Jakarta',
    category: 'Kuliner',
    date: '2026-11-20',
    location: 'Gelora Bung Karno, Jakarta',
    priceRange: 'Gratis - Rp50.000',
  },
];

/**
 * Halaman review event pending oleh Admin.
 * Memungkinkan admin untuk menyetujui (publish) atau menolak pembuatan event baru.
 */
export default function PendingEvents() {
  const [events, setEvents] = useState<PendingEvent[]>(mockEvents);
  const [search, setSearch] = useState('');

  const handleApprove = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    alert(`Event ID ${id} disetujui untuk dipublikasi!`);
  };

  const handleReject = (id: string) => {
    const reason = prompt('Masukkan alasan penolakan event:');
    if (reason !== null) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
      alert(`Event ID ${id} ditolak. Alasan: ${reason}`);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <Head>
        <title>Ulasan Event Tertunda — Admin TAQtix</title>
        <meta name="description" content="Halaman manajemen admin untuk meninjau dan meloloskan pembuatan event." />
      </Head>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Event Pending Review
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Tinjau pengajuan pembuatan event oleh organizer sebelum dipublikasikan ke publik.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <input
              type="text"
              placeholder="Cari event atau organizer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-slate-900/55 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/20">
                      {event.category}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">ID: #{event.id}</span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-100 line-clamp-1 hover:text-indigo-400 cursor-pointer">
                    {event.title}
                  </h2>

                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Organizer:</span>
                      <span className="font-semibold text-slate-300">{event.organizer}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Tanggal:</span>
                      <span className="font-mono text-slate-300">{event.date}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Lokasi:</span>
                      <span className="text-slate-300 text-right max-w-[70%] line-clamp-1">{event.location}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Rentang Harga:</span>
                      <span className="text-emerald-400 font-bold">{event.priceRange}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => handleReject(event.id)}
                    className="py-2.5 px-4 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    Tolak Event
                  </button>
                  <button
                    onClick={() => handleApprove(event.id)}
                    className="py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
                  >
                    Setujui & Terbitkan
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
            Tidak ada pengajuan event baru yang tertunda.
          </div>
        )}
      </div>
    </div>
  );
}
