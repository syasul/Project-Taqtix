'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Mail,
  MessageSquare,
  Music,
  GraduationCap,
  Trophy,
  Palette,
  Users2,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AboutPage() {
  const values = [
    {
      title: 'Amanah & Transparan',
      desc: 'Kami mengutamakan integritas dalam setiap transaksi dan proses ticketing. Informasi yang jelas, data yang terjaga, dan proses yang transparan menjadi fondasi kepercayaan antara penyelenggara, pembeli, dan TAQtix.',
      icon: ShieldCheck,
      color: 'text-[#00F0FF] bg-[#08ADAE]/15 border-[#08ADAE]/30',
    },
    {
      title: 'Inovasi Berkelanjutan',
      desc: 'Kami terus mengembangkan cara kerja dan teknologi untuk menyederhanakan proses ticketing, meningkatkan efisiensi penyelenggaraan event, dan memberikan pengalaman yang lebih baik bagi penyelenggara maupun audiens.',
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    },
    {
      title: 'Bertumbuh Bersama',
      desc: 'Kami membuka peluang kolaborasi dengan penyelenggara, komunitas, kreator, dan mitra untuk memperluas jangkauan event serta membangun ekosistem yang saling menguntungkan.',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    },
    {
      title: 'Praktis & Efisien',
      desc: 'Dari penjualan tiket hingga proses check-in, kami ingin membantu penyelenggara mengurangi kerumitan operasional agar lebih banyak energi dapat dicurahkan pada kualitas acara dan pengalaman audiens.',
      icon: Zap,
      color: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
    },
  ];

  const targetAudiences = [
    {
      title: 'Konser & Festival Musik',
      desc: 'Dari pertunjukan intim hingga festival berskala besar.',
      icon: Music,
    },
    {
      title: 'Workshop, Seminar & Konferensi',
      desc: 'Untuk kegiatan edukasi, profesional, dan pengembangan diri.',
      icon: GraduationCap,
    },
    {
      title: 'Acara Olahraga',
      desc: 'Mulai dari kompetisi, turnamen, hingga sport event.',
      icon: Trophy,
    },
    {
      title: 'Pertunjukan Seni & Hiburan',
      desc: 'Seperti teater, pameran, pertunjukan tari, dan acara kreatif.',
      icon: Palette,
    },
    {
      title: 'Event Komunitas & Gathering',
      desc: 'Untuk komunitas, organisasi, kampus, dan berbagai kelompok minat.',
      icon: Users2,
    },
    {
      title: 'Event Religi & Sosial',
      desc: 'Termasuk kajian, kegiatan amal, dan acara kemasyarakatan.',
      icon: HeartHandshake,
    },
    {
      title: 'Pameran & Aktivasi Brand',
      desc: 'Untuk pengalaman merek, expo, dan kegiatan promosi.',
      icon: Layers,
    },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Back to Home Button */}
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
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#00F0FF] bg-[#08ADAE]/15 border border-[#08ADAE]/30 astro-glass-pill">
          <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Tentang TAQtix</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          TICKETING & EVENT GROWTH PLATFORM
          <span className="block astro-neon-text text-2xl sm:text-3xl mt-1 font-extrabold">
            BUILT FOR EVENT BUILDERS.
          </span>
        </h1>
      </div>

      {/* Main Narrative Card */}
      <div className="astro-card rounded-3xl p-6 sm:p-10 space-y-5 text-slate-300 text-sm sm:text-base leading-relaxed border border-white/10 shadow-2xl bg-slate-900/60">
        <p>
          Setiap event punya cerita, audiens, dan tantangannya sendiri. Mulai dari konser musik, festival, workshop, acara olahraga, pertunjukan seni, hingga konferensi dan community gathering, setiap penyelenggara membutuhkan sistem ticketing yang andal agar bisa berfokus menciptakan pengalaman terbaik bagi audiensnya.
        </p>
        <p>
          <strong className="text-white">TAQtix</strong> hadir untuk membantu Event Builder mengelola penjualan tiket dengan lebih mudah, aman, dan transparan. Kami menghubungkan penyelenggara dengan audiens melalui sistem ticketing yang praktis, proses transaksi yang tepercaya, serta dukungan operasional sesuai kebutuhan event.
        </p>
        <p>
          Kami percaya bahwa event yang hebat dimulai dari fondasi operasional yang baik. Karena itu, TAQtix terus mengembangkan solusi yang membantu penyelenggara mengelola tiket, menjangkau audiens, dan mengembangkan event mereka dengan lebih terstruktur.
        </p>
      </div>

      {/* Core Values Section */}
      <div className="space-y-6 pt-4">
        <div className="text-center sm:text-left space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00F0FF]">Prinsip Kami</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Nilai Utama Kami</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="astro-card border border-white/10 rounded-2xl p-6 sm:p-7 space-y-3.5 hover:border-[#08ADAE]/50 transition-all bg-slate-900/60"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${val.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-base sm:text-lg">{val.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Audiences */}
      <div className="astro-glass rounded-3xl p-6 sm:p-10 space-y-6 border border-white/10 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00F0FF]">Ekosistem Terbuka</span>
          <h3 className="text-2xl font-extrabold text-white">Siapa saja yang menggunakan TAQtix?</h3>
          <p className="text-xs sm:text-sm text-slate-400">TAQtix hadir untuk berbagai jenis event dan komunitas.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {targetAudiences.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl astro-card border border-white/10 flex items-start gap-3.5 bg-slate-900/70"
              >
                <div className="h-9 w-9 rounded-xl bg-[#08ADAE]/15 border border-[#08ADAE]/30 flex items-center justify-center text-[#00F0FF] shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm">{item.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10 text-center sm:text-left">
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Apa pun jenis event-mu, TAQtix siap menjadi bagian dari perjalananmu dalam menghadirkan event yang lebih terkelola dan berkesan.
          </p>
        </div>
      </div>

      {/* Contact & CTA Section */}
      <div className="rounded-3xl astro-glass text-white p-8 sm:p-12 text-center border border-white/15 shadow-2xl space-y-5 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#060913] relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#08ADAE]/20 rounded-full blur-[100px] pointer-events-none" />

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-[#00F0FF] border border-white/15 backdrop-blur-md">
          <Mail className="w-3.5 h-3.5" />
          Kemitraan & Kolaborasi
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Tertarik Bekerjasama dengan TAQtix?
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Hubungi tim kami untuk konsultasi ticketing, integrasi kustom, atau dukungan penyelenggaraan event Anda.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <a
            href="mailto:halo@taqtix.id"
            className="inline-flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-200 font-bold px-5 py-2.5 rounded-full text-xs transition shadow-sm cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-[#08ADAE]" />
            <span>Email: halo@taqtix.id</span>
          </a>
          <a
            href="https://wa.me/628158006658"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#08ADAE] via-[#00F0FF] to-[#08ADAE] hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-full text-xs transition shadow-[0_0_24px_rgba(8,173,174,0.45)] cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp: +62 815-800-6658</span>
          </a>
        </div>
      </div>
    </div>
  );
}
