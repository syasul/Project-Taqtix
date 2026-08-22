import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileSearch,
  DollarSign,
  History,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

import SidebarNav from '@/components/sidebar-nav';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = parseJwt(token);
  const email = payload?.email || 'admin@taqtix.id';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Branding */}
          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-red-650" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">TAQtix</span>
              <span className="block text-[10px] text-red-600 font-mono tracking-widest font-bold uppercase">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <SidebarNav />
        </div>

        {/* Admin User Info & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Logged in as
            </span>
            <span className="block text-xs font-semibold text-slate-700 truncate" title={email}>
              {email}
            </span>
          </div>

          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600" />
              Keluar Sesi
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 border border-red-200 text-red-600 uppercase tracking-widest">
              Secured Console
            </div>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 p-8 overflow-y-auto min-h-0 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
