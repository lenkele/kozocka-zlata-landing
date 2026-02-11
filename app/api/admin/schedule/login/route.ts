import { NextResponse } from 'next/server';

import { buildSessionToken, getCookieName, getAdminScheduleCredentials } from '@/lib/adminScheduleAuth';

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  const credentials = getAdminScheduleCredentials();
  if (!credentials) {
    return NextResponse.json({ ok: false, reason: 'admin_credentials_not_configured' }, { status: 500 });
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const login = body.login?.trim() ?? '';
  const password = body.password?.trim() ?? '';
  if (!login || !password) {
    return NextResponse.json({ ok: false, reason: 'missing_credentials' }, { status: 400 });
  }

  if (login !== credentials.login || password !== credentials.password) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 });
  }

  const token = buildSessionToken(login);
  const response = NextResponse.json({ ok: true, authenticated: true, login });
  response.cookies.set({
    name: getCookieName(),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
