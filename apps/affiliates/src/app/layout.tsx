import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import LayoutShell from '@/components/layout-shell';

export const metadata: Metadata = {
  title: {
    default: 'TAQtix Affiliates - Portal Mitra Afiliasi',
    template: '%s | TAQtix Affiliates',
  },
  description: 'Dashboard kemitraan affiliator penjualan tiket event TAQtix',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <LayoutShell>{children}</LayoutShell>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
