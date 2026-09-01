import React from 'react';

/**
 * Clean & dedicated Auth layout for TAQtix Partner/EO (no navbar/header).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow matching Teal & Gold brand palette */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#08B4B5]/12 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#F1B829]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-900/30 blur-2xl pointer-events-none" />

      <main className="w-full flex items-center justify-center relative z-10">
        {children}
      </main>
    </div>
  );
}
