import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { DEFAULT_SHOW_SLUG, isShowSlug } from '@/shows';
import { type ShowSlug } from '@/shows/types';

const LEGACY_HOST_TO_SHOW: Record<string, ShowSlug> = {
  'www.ryba-kiva-zlata.com': 'zlata',
  'ryba-kiva-zlata.com': 'zlata',
  'www.ryba-kiva-marita.com': 'marita',
  'ryba-kiva-marita.com': 'marita',
  'www.ryba-kiva-gefilte-lid.com': 'gefilte-lid',
  'ryba-kiva-gefilte-lid.com': 'gefilte-lid',
};

const CANONICAL_ORIGIN = 'https://ryba-kiva.com';

const DEV_HOST_TO_SHOW: Record<string, ShowSlug> = {
  localhost: DEFAULT_SHOW_SLUG,
  '127.0.0.1': DEFAULT_SHOW_SLUG,
};

const EXCLUDED_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico', '/shows'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hostHeader = request.headers.get('host')?.toLowerCase() ?? '';
  const hostname = hostHeader.split(':')[0];
  const legacyShowSlug = LEGACY_HOST_TO_SHOW[hostname];

  if (legacyShowSlug) {
    // Keep legacy payment callbacks reachable until the old domains expire.
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const redirectUrl = new URL(pathname === '/' ? `/${legacyShowSlug}` : pathname, CANONICAL_ORIGIN);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Проверяем, не является ли текущий путь уже валидным slug спектакля
  const currentSlug = pathname.split('/')[1];
  if (currentSlug && isShowSlug(currentSlug)) {
    // Путь уже указывает на конкретный спектакль - не трогаем его
    return NextResponse.next();
  }

  const targetSlug = DEV_HOST_TO_SHOW[hostname];

  if (!targetSlug || !isShowSlug(targetSlug)) {
    return NextResponse.next();
  }

  // Rewrite only the local root route to the default show.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${targetSlug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|shows).*)'],
};

