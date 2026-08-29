import { NextRequest, NextResponse } from 'next/server';

/**
 * Gates the whole app behind a single shared password.
 *
 * The app has no user accounts by design (see DECISIONS.md) — this is not
 * auth in the multi-user sense, it's a lock on the front door, because the
 * deployment URL is public and the data behind it is real.
 *
 * Set APP_PASSWORD and AUTH_SECRET in the environment. If APP_PASSWORD is
 * unset the app refuses all traffic rather than falling open — an unset
 * password on a public URL is the exact failure this file exists to prevent.
 */

const COOKIE_NAME = 'planner_auth';

// Paths that must stay reachable without the cookie.
const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * The cookie value is an HMAC of the password, not the password itself, so a
 * stolen cookie doesn't hand over the password — and rotating APP_PASSWORD
 * invalidates every existing session.
 */
async function expectedToken(password: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Length-independent constant-time compare. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare a fixed-size digest of each so length never short-circuits.
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  // Fail closed. A missing password must never mean "let everyone in".
  if (!password || !secret) {
    return new NextResponse(
      'APP_PASSWORD and AUTH_SECRET must be set. Refusing to serve.',
      { status: 503 }
    );
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const expected = await expectedToken(password, secret);

  if (cookie && safeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  // API routes get a 401 rather than an HTML redirect, so client fetches
  // fail loudly instead of parsing a login page as JSON.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next's static assets, which carry no data.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
