import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL('/login', requestUrl.origin));
  
  // Delete the admin_access_token cookie
  response.cookies.set('admin_access_token', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
