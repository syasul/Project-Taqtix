import React from 'react';
import Header from '../../components/layout/header';

/**
 * Layout khusus untuk halaman-halaman otentikasi (login/register).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
