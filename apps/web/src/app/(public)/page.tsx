'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Ticket,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  organizer: {
    name: string;
  };
}

const categories = ['Semua', 'Konser', 'Kajian', 'Bazaar & Culinary', 'Workshop'];

export default function MarketplacePage() {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Semua');

  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data;
    },
  });

  const events: Event[] = eventsResponse?.data || [];

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());

    if (selectedCategory === 'Semua') return matchesSearch;
    if (selectedCategory === 'Konser') {
      return matchesSearch && (
        e.title.toLowerCase().includes('concert') ||
        e.title.toLowerCase().includes('sholawat') ||
        e.title.toLowerCase().includes('simfoni')
      );
    }
    if (selectedCategory === 'Kajian') {
      return matchesSearch && e.title.toLowerCase().includes('kajian');
    }
    if (selectedCategory === 'Bazaar & Culinary') {
      return matchesSearch && (
        e.title.toLowerCase().includes('culinary') ||
        e.title.toLowerCase().includes('fest') ||
        e.title.toLowerCase().includes('hijrah')
      );
    }
    if (selectedCategory === 'Workshop') {
      return matchesSearch && e.title.toLowerCase().includes('workshop');
    }
    return matchesSearch;
  });

  const featuredEvent = events.find((e) => e.slug === 'taqwa-movement-2026');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Temukan Event Terbaik & Dapatkan Tiket Anda
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
          Infrastruktur ticketing modern anti double-booking untuk pengalaman festival, konser, dan kajian religi terbaik.
        </p>

        {/* Search & Categories */}
        <div className="space-y-6 max-w-xl mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari konser, festival, lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm shadow-sm transition"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer",
                  selectedCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-850"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Counter */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="space-y-1">
          <p className="text-3xl font-extrabold text-indigo-600">10k+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiket Terjual</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-indigo-600">50+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Sukses</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-indigo-600">2.5k+</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner Afiliasi</p>
        </div>
        <div className="space-y-1 border-l border-slate-200">
          <p className="text-3xl font-extrabold text-indigo-600">99.9%</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistem Uptime</p>
        </div>
      </div>

      {/* Highlight/Featured Event Banner */}
      {featuredEvent && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 md:flex">
          <div className="relative h-64 md:h-auto md:w-1/2 bg-slate-100 overflow-hidden">
            {featuredEvent.bannerUrl ? (
              <img
                src={featuredEvent.bannerUrl}
                alt={featuredEvent.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center p-8 min-h-[250px]">
                <Ticket className="h-16 w-16 text-indigo-600/30" />
              </div>
            )}
            <span className="absolute top-4 left-4 text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              EVENT PILIHAN
            </span>
          </div>
          <div className="p-8 md:w-1/2 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Diselenggarakan oleh {featuredEvent.organizer.name}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {featuredEvent.title}
              </h3>
              <p className="text-slate-550 text-sm leading-relaxed line-clamp-3">
                {featuredEvent.description}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-medium text-slate-650">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>
                    {format(new Date(featuredEvent.startDate), 'd MMMM yyyy, HH:mm', { locale: localeId })} WIB
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{featuredEvent.location}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Tiket mulai dari <strong className="text-indigo-600 text-sm sm:text-base font-extrabold">Rp 100.000</strong></span>
              <Link
                href={`/event/${featuredEvent.slug}`}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm border-0 flex items-center gap-2 cursor-pointer text-xs"
                )}
              >
                <span>Beli Tiket Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Event Unggulan</h2>
          <span className="text-xs font-medium text-slate-500">
            Menampilkan {filteredEvents.length} Event
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full bg-slate-100" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4 bg-slate-100" />
                  <Skeleton className="h-4 w-1/2 bg-slate-100" />
                  <Skeleton className="h-4 w-2/3 bg-slate-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <p className="text-rose-600 text-sm">Gagal memuat event. Silakan coba beberapa saat lagi.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <p className="text-slate-500 text-sm">Tidak ada event yang ditemukan matching pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const formattedDate = format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', {
                locale: localeId,
              });

              return (
                <Card
                  key={event.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition duration-300 overflow-hidden group flex flex-col justify-between rounded-2xl shadow-sm"
                >
                  <div>
                    {/* Event Banner */}
                    <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
                      {event.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-indigo-50/50 flex items-center justify-center">
                          <Calendar className="h-10 w-10 text-indigo-500/50" />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {event.organizer.name}
                      </span>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition">
                        {event.title}
                      </h3>

                      <div className="space-y-2 text-xs text-slate-500 font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formattedDate} WIB</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/event/${event.slug}`}
                      className={cn(
                        buttonVariants({ variant: 'default' }),
                        "w-full bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold cursor-pointer h-auto border-0 shadow-sm"
                      )}
                    >
                      <span>Detail & Beli Tiket</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Why Choose Us */}
      <div className="pt-8 border-t border-slate-200 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Kenapa Memilih TAQtix?</h2>
          <p className="text-slate-500 text-sm">
            Infrastruktur ticketing modern yang dirancang khusus untuk mempermudah manajemen event tanpa ribet.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Anti Double-Booking</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sistem manajemen antrean otomatis kami mengamankan kuota tiket secara real-time saat pembeli checkout, menjamin tidak ada tiket ganda.
            </p>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Afiliasi Transparan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Promosikan event menggunakan tautan unik partner. Hitung klik, penjualan, dan pembagian komisi secara otomatis dan transparan.
            </p>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">E-Tiket via WhatsApp</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              E-Tiket resmi dengan QR Code unik langsung terkirim secara instan ke nomor WhatsApp pembeli begitu konfirmasi pembayaran diterima.
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="pt-8 border-t border-slate-200 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Cara Membeli Tiket</h2>
          <p className="text-slate-500 text-sm">
            Dapatkan tiket event favorit Anda hanya dalam 3 langkah mudah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
              1
            </div>
            <h4 className="font-bold text-slate-800 text-base">Pilih Event</h4>
            <p className="text-slate-500 text-xs max-w-xs">
              Jelajahi halaman Discovery untuk menemukan konser, kajian, bazar kuliner, atau workshop yang Anda sukai.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
              2
            </div>
            <h4 className="font-bold text-slate-800 text-base">Bayar Instan</h4>
            <p className="text-slate-500 text-xs max-w-xs">
              Lakukan checkout dan pilih metode pembayaran favorit Anda seperti QRIS, e-Wallet, atau Virtual Account Bank.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
              3
            </div>
            <h4 className="font-bold text-slate-800 text-base">Terima E-Tiket</h4>
            <p className="text-slate-500 text-xs max-w-xs">
              E-Tiket resmi dengan QR Code langsung dikirim otomatis via WhatsApp dan email. Cukup scan di pintu masuk event!
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="pt-8 border-t border-slate-200 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Apa Kata Penyelenggara & Pembeli?</h2>
          <p className="text-slate-500 text-sm">
            Telah dipercaya oleh puluhan organisasi dakwah dan ribuan penikmat event syariah di seluruh Indonesia.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <p className="text-slate-650 italic text-xs sm:text-sm leading-relaxed">
              "Sebelum menggunakan TAQtix, kami sering pusing menangani keluhan pembeli karena tiket ganda (overbook). Dengan sistem antrean real-time TAQtix, konser sholawat kami berjalan lancar tanpa satu pun komplain tiket!"
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-650 text-sm shrink-0">
                AH
              </div>
              <div>
                <h5 className="font-bold text-slate-850 text-sm">Ahmad Hidayat</h5>
                <p className="text-[10px] text-slate-500">Ketua Yayasan Taqwa Media Group</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <p className="text-slate-655 italic text-xs sm:text-sm leading-relaxed">
              "Proses belinya gampang banget. Begitu pembayaran terkonfirmasi via QRIS, e-ticket langsung masuk ke WhatsApp saya dalam hitungan detik. Gak perlu buka email atau install aplikasi baru!"
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-650 text-sm shrink-0">
                SF
              </div>
              <div>
                <h5 className="font-bold text-slate-850 text-sm">Siti Fatimah</h5>
                <p className="text-[10px] text-slate-500">Pembeli Tiket Konser & Kajian</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 space-y-6 text-center max-w-3xl mx-auto shadow-sm">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Jangan Lewatkan Event Menarik Selanjutnya</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            Dapatkan informasi kajian akbar, konser religi terupdate, dan promo tiket khusus langsung di email Anda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Masukkan alamat email Anda"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-indigo-650 focus:outline-none text-xs shadow-inner"
          />
          <button
            onClick={() => alert('Terima kasih telah berlangganan!')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm shrink-0 border-0"
          >
            Berlangganan
          </button>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-indigo-900 text-white rounded-3xl p-8 md:p-12 text-center md:text-left md:flex md:items-center md:justify-between gap-8 shadow-md">
        <div className="space-y-4 max-w-2xl">
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Ingin Mengadakan Event Sendiri?</h3>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Gunakan TAQtix untuk mempermudah penjualan tiket secara terintegrasi, atur program promosi afiliasi, dan pantau data kehadiran secara langsung di gerbang masuk.
          </p>
        </div>
        <div className="mt-6 md:mt-0 shrink-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-950 font-bold px-6 py-3 rounded-2xl transition shadow-sm cursor-pointer text-sm"
          >
            <span>Mulai Buat Event</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
