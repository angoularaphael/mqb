import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/reset-password', '/request-reset', '/'];

  // Check if route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Cookie lu depuis la requête (Edge middleware — ne pas utiliser cookies() de next/headers ici)
  const token = request.cookies.get('auth_token')?.value ?? null;

  if (!token) {
    // If no token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = await verifyJWT(token);

  if (!payload) {
    // If token is invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/teacher') && payload.role !== 'teacher' && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/student') && payload.role !== 'student' && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/parent') && payload.role !== 'parent' && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
