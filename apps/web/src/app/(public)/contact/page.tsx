'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pesan Anda berhasil dikirim! Tim kami akan menghubungi Anda dalam waktu 24 jam.');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#08B4B5] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Hubungi Kami
        </h1>
        <p className="text-slate-500 text-sm">
          Punya pertanyaan tentang pembelian tiket, pendaftaran event, atau kemitraan afiliasi? Hubungi tim support kami.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-slate-800 text-lg">Informasi Kontak</h3>
            
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-[#08B4B5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Email Support</p>
                  <a href="mailto:support@taqtix.id" className="hover:underline text-[#08B4B5]">
                    support@taqtix.id
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-[#08B4B5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">WhatsApp Hotline</p>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="hover:underline text-[#08B4B5]">
                    +62 812-3456-7890
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#08B4B5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Kantor Pusat</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Taqwa Space Coworking, Tebet Raya No. 42,<br />
                    Jakarta Selatan, DKI Jakarta 12810
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="font-bold text-slate-800 text-xs">Jam Layanan Support</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Senin - Jum'at: 09:00 - 18:00 WIB<br />
                Sabtu - Minggu: 10:00 - 15:00 WIB (Hanya Chat)
              </p>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="font-bold text-slate-800 text-lg">Kirim Pesan</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-[#08B4B5] focus:outline-none text-xs"
                    placeholder="Contoh: Ahmad Fauzi"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-700">Alamat Email</label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-[#08B4B5] focus:outline-none text-xs"
                    placeholder="Contoh: fauzi@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-slate-700">Subjek Kategori</label>
                <select
                  id="subject"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-[#08B4B5] focus:outline-none text-xs"
                  required
                >
                  <option value="tiket">Masalah Pembelian Tiket & Pembayaran</option>
                  <option value="organizer">Pendaftaran Event Organizer Baru</option>
                  <option value="afiliasi">Kemitraan Afiliasi / Komisi Partner</option>
                  <option value="lainnya">Pertanyaan Umum Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-slate-700">Isi Pesan Anda</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-[#08B4B5] focus:outline-none text-xs"
                  placeholder="Tuliskan keluhan atau pertanyaan Anda secara lengkap di sini..."
                  required
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm border-0"
                >
                  <span>Kirim Pesan</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
