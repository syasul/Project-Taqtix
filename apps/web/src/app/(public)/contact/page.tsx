'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#00F0FF] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Hubungi Kami
        </h1>
        <p className="text-slate-400 text-sm">
          Punya pertanyaan tentang pembelian tiket, pendaftaran event, atau kemitraan afiliasi? Hubungi tim support kami.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="astro-card rounded-2xl p-6 space-y-6 border border-white/10 bg-slate-900/60 shadow-xl">
            <h3 className="font-bold text-white text-lg">Informasi Kontak</h3>
            
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-[#00F0FF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Email Support</p>
                  <a href="mailto:halo@taqtix.id" className="hover:underline text-[#00F0FF]">
                    halo@taqtix.id
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-[#00F0FF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">WhatsApp Hotline</p>
                  <a href="https://wa.me/628158006658" target="_blank" rel="noreferrer" className="hover:underline text-[#00F0FF]">
                    +62 815-800-6658
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#00F0FF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Kantor Pusat</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    JL.DR CIPTO VII/34, RT/RW: 006/010,<br />
                    Desa/Kelurahan Bedali, Kecamatan Lawang,<br />
                    Kabupaten Malang, Provinsi Jawa Timur
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="font-bold text-white text-xs">Jam Layanan Support</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Senin - Jum&apos;at: 09:00 - 18:00 WIB<br />
                Sabtu - Minggu: 10:00 - 15:00 WIB (Hanya Chat)
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="astro-card rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10 bg-slate-900/60 shadow-xl">
            <h3 className="font-bold text-white text-lg">Kirim Pesan</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] transition-colors text-xs"
                    placeholder="Contoh: Ahmad Fauzi"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] transition-colors text-xs"
                    placeholder="Contoh: ahmad@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-slate-300">Subjek</label>
                <input
                  id="subject"
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] transition-colors text-xs"
                  placeholder="Contoh: Pertanyaan Pembayaran Tiket"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-slate-300">Pesan</label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] transition-colors text-xs resize-none"
                  placeholder="Tuliskan pertanyaan atau kebutuhan Anda secara detail..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(8,173,174,0.4)] active:scale-95"
              >
                <span>Kirim Pesan</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
