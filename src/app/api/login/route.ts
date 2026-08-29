import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'planner_auth';

async function makeToken(password: string, secret: string): Promise<string> {
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

export async function POST(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!password || !secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const { password: submitted } = await request.json();

  if (submitted !== password) {
    // Blunt delay to make guessing tedious. Not a substitute for a strong
    // password — the point is that the password is long, not that this is slow.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await makeToken(password, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // a year — this is a phone app opened daily
    path: '/',
  });
  return response;
}
