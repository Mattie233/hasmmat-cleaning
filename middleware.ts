import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter per IP. Suitable for single-instance dev/prod only.
const RATE_LIMIT = 100; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

const ipMap: Map<string, { count: number; reset: number }> = new Map();

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Apply rate limit to API routes only
  if (url.pathname.startsWith('/api')) {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    const entry = ipMap.get(ip);

    if (!entry || now > entry.reset) {
      ipMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    } else {
      entry.count += 1;
      ipMap.set(ip, entry);
      if (entry.count > RATE_LIMIT) {
        return new NextResponse('Too many requests', { status: 429 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
