import React from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-liquid-canvas text-slate-900 relative selection:bg-[#08ADAE]/20 selection:text-[#08ADAE]">
      <Header />
      <main className="flex-1 w-full pt-24 sm:pt-28">
        {children}
      </main>

      <Footer />
    </div>
  );
}
