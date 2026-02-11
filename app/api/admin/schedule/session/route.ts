import { NextResponse } from 'next/server';

import { getCookieName, getAdminScheduleCredentials, verifySessionToken } from '@/lib/adminScheduleAuth';

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((item) => item.trim());
  for (const part of parts) {
    const [key, ...value] = part.split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export async function GET(request: Request) {
  const credentials = getAdminScheduleCredentials();
  if (!credentials) {
    return NextResponse.json({ ok: false, reason: 'admin_credentials_not_configured' }, { status: 500 });
  }

  const token = readCookie(request, getCookieName());
  if (!token) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const payload = verifySessionToken(token);
  if (!payload || payload.login !== credentials.login) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  return NextResponse.json({ ok: true, authenticated: true, login: payload.login });
}
