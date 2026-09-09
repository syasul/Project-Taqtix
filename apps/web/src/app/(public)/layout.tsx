import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/header';
import { Ticket, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-liquid-canvas text-slate-900 relative selection:bg-[#08ADAE]/20 selection:text-[#08ADAE]">
      <Header />
      <main className="flex-1 w-full pt-24 sm:pt-28">
        {children}
      </main>

      {/* Modern Liquid Glass Style Footer */}
      <footer className="border-t border-white/80 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-100">
            {/* Brand column */}
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="TAQtix Logo"
                  width={120}
                  height={34}
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                Infrastruktur ticketing modern anti double-booking dengan pengiriman e-ticket WhatsApp otomatis dan verifikasi QR kilat untuk seluruh acara di Indonesia.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sistem Aktif & Terlindungi
                </span>
              </div>
            </div>

            {/* Quick Navigation Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jelajahi Event</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Semua Event
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=Konser" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Konser Musik
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=Kajian" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Kajian & Halal Expo
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=Workshop" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Workshop & Edukasi
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Penyelenggara</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/register'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-[#08ADAE] transition-colors"
                    >
                      <span>Bikin Event (EO)</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  </li>
                  <li>
                    <a
                      href={process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003/login'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-[#08ADAE] transition-colors"
                    >
                      Portal Masuk EO
                    </a>
                  </li>
                  <li>
                    <Link href="/help" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Panduan Kru & Scanner
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bantuan & Info</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/about" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Tentang TAQtix
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Pusat Bantuan (FAQ)
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-slate-600 hover:text-[#08ADAE] transition-colors">
                      Hubungi Tim Kami
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} TAQtix Inc. Hak Cipta Dilindungi Undang-Undang.</p>
            <div className="flex items-center gap-6">
              <Link href="/help" className="hover:text-[#08ADAE] transition">Syarat & Ketentuan</Link>
              <Link href="/help" className="hover:text-[#08ADAE] transition">Kebijakan Privasi</Link>
              <span className="text-slate-300">•</span>
              <span className="text-[#08ADAE] font-semibold">TAQtix Ticketing Suite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
