'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Heart, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Back to Home Button */}
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
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Tentang TAQtix
        </h1>
        <p className="text-[#08B4B5] text-sm sm:text-base font-semibold uppercase tracking-wider">
          Event Growth Infrastructure — Religi, Modern & Amanah.
        </p>
      </div>

      {/* Main Narrative */}
      <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-6">
        <p>
          TAQtix lahir dari sebuah tantangan nyata di industri manajemen acara: bagaimana menyelenggarakan event (khususnya konser religi, festival halal, dan kajian akbar) dengan profesionalisme tinggi tanpa terkendala masalah teknis klasik seperti <strong>double-booking tiket</strong> atau sistem promosi yang tidak transparan.
        </p>
        <p>
          Kami membangun <strong>infrastruktur pertumbuhan event (Event Growth Infrastructure)</strong> yang lengkap untuk membantu promotor menjual tiket secara aman, membangun audiens setia, serta memperluas jangkauan pemasaran secara sehat melalui ekosistem afiliasi syariah yang transparan.
        </p>
      </div>

      {/* Core Values Section */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Nilai Utama Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#08B4B5]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Amanah & Terpercaya</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Kami menjaga integritas setiap transaksi tiket pembeli dengan perlindungan antrean real-time, memastikan keabsahan data masuk tanpa manipulasi kuota.
            </p>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#08B4B5]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Inovasi Berkelanjutan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Integrasi WhatsApp E-Ticket instan, dashboard analitik real-time, dan optimasi pemindaian QR Code di lokasi fisik saat hari-H event.
            </p>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#08B4B5]">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Pemberdayaan Umat</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Melalui program afiliasi, kami membuka peluang ekonomi kreatif bagi komunitas dakwah, sukarelawan, dan influencer syariah untuk mendapatkan pembagian hasil secara transparan.
            </p>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#08B4B5]">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Kemudahan Mutlak</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Tanpa aplikasi tambahan bagi pembeli. Mulai dari pemesanan, pembayaran multipayment, hingga penerimaan tiket, semuanya dilakukan lewat web dan WhatsApp chat.
            </p>
          </Card>
        </div>
      </div>

      {/* Target Audiences */}
      <div className="bg-white rounded-2xl p-8 space-y-4 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Siapa saja yang menggunakan TAQtix?</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 font-medium">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#08B4B5]"></span>
            <span>Promotor Event Musik & Festival</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#08B4B5]"></span>
            <span>Yayasan & Lembaga Dakwah Masjid</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#08B4B5]"></span>
            <span>Komunitas Pemuda Hijrah & Kreatif</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#08B4B5]"></span>
            <span>Penyedia Halal Expo & Kuliner</span>
          </li>
        </ul>
      </div>

      {/* Contact Section */}
      <div className="text-center pt-8 border-t border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Tertarik Bekerjasama?</h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Hubungi tim kemitraan kami untuk integrasi ticketing kustom atau program promotor berskala besar.
        </p>
        <div>
          <a
            href="mailto:support@taqtix.id"
            className="inline-flex items-center gap-2 bg-[#08B4B5] hover:bg-[#079b9c] text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm text-sm border-0"
          >
            Hubungi Kemitraan TAQtix
          </a>
        </div>
      </div>
    </div>
  );
}
