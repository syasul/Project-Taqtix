import React from 'react';
import Header from '@/components/layout/header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full bg-slate-950">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} TAQtix. All rights reserved.</p>
          <p className="mt-2 text-slate-600">Event Growth Infrastructure MVP</p>
        </div>
      </footer>
    </div>
  );
}
