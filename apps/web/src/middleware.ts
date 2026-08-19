import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js untuk memproteksi rute dashboard (/dashboard/*).
 * Mengalihkan pengguna ke halaman login jika cookie token tidak ditemukan.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('taqtix_token')?.value;
  const { pathname } = request.nextUrl;

  // Jika mencoba mengakses dashboard dan tidak ada token
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    // Simpan rute asal agar setelah login bisa kembali ke rute tersebut
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mencoba mengakses halaman auth (login/register)
  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
