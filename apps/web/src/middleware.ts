import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Pengurai sederhana token JWT di edge runtime tanpa library eksternal.
 */
function parseJwtRole(token: string): string | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('taqtix_token')?.value;
  const { pathname } = request.nextUrl;

  const eoPortalUrl = process.env.NEXT_PUBLIC_EO_URL || 'http://localhost:3003';
  const adminPortalUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002';

  // 1. Jika mencoba mengakses rute spesifik organizer (/dashboard/events, /dashboard/sales, dll)
  if (pathname.startsWith('/dashboard/events') || pathname.startsWith('/dashboard/sales') || pathname.startsWith('/dashboard/buyers')) {
    return NextResponse.redirect(new URL(pathname, eoPortalUrl));
  }

  // 2. Proteksi rute dashboard /dashboard
  if (pathname.startsWith('/dashboard')) {
    // Jika tidak ada token login, redirect ke /login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Periksa role pengguna dari token
    const role = parseJwtRole(token);

    // Jika admin tidak sengaja masuk ke fe-web dashboard, arahkan ke admin portal
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', adminPortalUrl));
    }
  }

  // 3. Jika sudah login dan mencoba membuka halaman login/register
  if ((pathname === '/login' || pathname === '/register') && token) {
    const role = parseJwtRole(token);
    if (role === 'organizer') {
      return NextResponse.redirect(new URL('/dashboard', eoPortalUrl));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
