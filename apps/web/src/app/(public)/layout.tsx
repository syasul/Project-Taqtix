import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full bg-slate-50">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <p>© {new Date().getFullYear()} TAQtix. All rights reserved.</p>
            <p className="text-slate-400 text-[10px]">Event Growth Infrastructure MVP</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
            <Link href="/about" className="hover:text-indigo-600 transition">Tentang Kami</Link>
            <Link href="/help" className="hover:text-indigo-600 transition">Pusat Bantuan (FAQ)</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition">Hubungi Kami</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
