import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define public routes
  const isPublicRoute = pathname.startsWith('/login');
  
  // Get token from cookies
  const token = request.cookies.get('admin_access_token')?.value;
  
  let isAuthenticated = false;
  let isAdmin = false;

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      const isExpired = payload.exp * 1000 < Date.now();
      if (!isExpired) {
        isAuthenticated = true;
        isAdmin = payload.role === 'admin';
      }
    }
  }

  // Redirect logic
  if (!isAuthenticated || !isAdmin) {
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // If authenticated and is admin, and trying to go to login, redirect to dashboard
    if (isPublicRoute) {
      const dashboardUrl = new URL('/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
