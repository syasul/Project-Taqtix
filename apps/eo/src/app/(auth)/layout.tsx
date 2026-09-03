import React from 'react';

/**
 * Clean & dedicated Auth layout for TAQtix Partner/EO with dominant white theme.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 sm:p-6 relative overflow-hidden">
      <main className="w-full flex items-center justify-center relative z-10">
        {children}
      </main>
    </div>
  );
}
